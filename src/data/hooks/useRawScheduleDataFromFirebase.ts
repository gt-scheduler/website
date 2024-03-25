import { Immutable, castImmutable, castDraft } from 'immer';
import { useCallback, useEffect, useState } from 'react';

import { SignedIn } from '../../contexts/account';
import { ErrorWithFields, softError } from '../../log';
import {
  LoadingState,
  LoadingStateCustom,
  LoadingStateError,
} from '../../types';
import { db, isAuthEnabled, schedulesCollection } from '../firebase';
import migrateScheduleData from '../migrations';
import { AnyScheduleData, defaultScheduleData, ScheduleData } from '../types';
import { getCurrentRawScheduleFromStorage } from './useRawScheduleDataFromStorage';

type HookResult = {
  rawScheduleData: Immutable<AnyScheduleData> | null;
  setRawScheduleData: (
    next:
      | ((current: AnyScheduleData | null) => AnyScheduleData | null)
      | AnyScheduleData
  ) => void;
};

type ScheduleDataState = Loading | NonExistant | Exists;
type Loading = {
  type: 'loading';
};
type NonExistant = {
  type: 'nonExistant';
};
type Exists = {
  type: 'exists';
  data: AnyScheduleData;
};

/**
 * Gets the current schedule data from Firebase.
 * Do not call this function in a non-root component;
 * it should only be called once in a root component (i.e. <App>).
 */
export default function useRawScheduleDataFromFirebase(
  account: SignedIn
): LoadingState<HookResult> {
  const [scheduleData, setScheduleData] = useState<ScheduleDataState>({
    type: 'loading',
  });
  const [permanentError, setPermanentError] = useState<
    LoadingStateError | LoadingStateCustom | null
  >(null);
  useEffect(() => {
    if (!isAuthEnabled) return undefined;

    const removeSnapshotListener = schedulesCollection
      .doc(account.id)
      .onSnapshot(
        {
          // Ignore metadata changes
          includeMetadataChanges: false,
        },
        (doc) => {
          const data = doc.data();
          if (data == null) {
            setScheduleData({ type: 'nonExistant' });
          } else {
            setScheduleData({
              type: 'exists',
              data: doc.data() as AnyScheduleData,
            });
          }
        }
      );
    return (): void => removeSnapshotListener();
  }, [account.id]);

  const setScheduleDataPersistent = useCallback(
    (
      next:
        | ((current: AnyScheduleData | null) => AnyScheduleData | null)
        | AnyScheduleData
    ): void => {
      let nextScheduleData;
      setScheduleData((state: ScheduleDataState) => {
        if (typeof next === 'function') {
          let currentScheduleData;
          if (state.type === 'exists') {
            currentScheduleData = state.data;
          } else {
            currentScheduleData = null;
          }
          nextScheduleData = next(currentScheduleData);
        } else {
          nextScheduleData = next;
        }
        if (nextScheduleData === null) return state;

        // Eagerly set the schedule data here as well.
        // It would be okay to wait until Firebase updates the state for us,
        // (which it will do, even before the network calls are made),
        // but this allows a window where state can react based on stale state.
        return { type: 'exists', data: nextScheduleData };
      });

      if (nextScheduleData === undefined || nextScheduleData === null) return;

      schedulesCollection
        .doc(account.id)
        .set(nextScheduleData)
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'error when updating remote document',
              source: err,
              fields: {
                accountId: account.id,
              },
            })
          );
        });
    },
    [account.id]
  );

  // Perform a transaction if the type is non-existent,
  // trying to pull existing data from local storage
  // (migrating it as needed),
  // and storing it in Firebase.
  // This serves to provide the initial account data.
  useEffect(() => {
    if (!isAuthEnabled) return;

    if (scheduleData.type === 'nonExistant') {
      // Imperatively get the latest migrated data
      let currentScheduleData: Immutable<ScheduleData>;
      try {
        currentScheduleData = getCurrentScheduleData() ?? defaultScheduleData;
      } catch (err) {
        softError(
          new ErrorWithFields({
            message:
              'failed to imperatively get current schedule data during account seeding',
            source: err,
            fields: {
              accountId: account.id,
            },
          })
        );
        currentScheduleData = defaultScheduleData;
      }

      // Start the transaction
      db.runTransaction(async (transaction) => {
        const currentDoc = await transaction.get(
          schedulesCollection.doc(account.id)
        );
        if (currentDoc.exists) return;
        transaction.set(
          schedulesCollection.doc(account.id),
          castDraft(currentScheduleData)
        );
      }).catch((err) => {
        // Send the error to Sentry
        const error = new ErrorWithFields({
          message: 'an error occurred while initializing account schedule data',
          source: err,
          fields: {
            account: account.id,
          },
        });
        softError(error);

        // Report the error to the user
        setPermanentError({
          type: 'error',
          error,
          stillLoading: false,
          overview: String(err),
        });
      });
    }
  }, [account.id, scheduleData.type]);

  // If this hook is running and auth is not enabled,
  // then something is wrong with the state.
  // Show an error.
  if (!isAuthEnabled) {
    return {
      type: 'error',
      error: new ErrorWithFields({
        message: 'cannot obtain data from firebase: authentication is disabled',
      }),
      stillLoading: false,
      overview: 'authentication is not enabled',
    };
  }

  if (permanentError !== null) {
    return permanentError;
  }

  if (scheduleData.type === 'loading' || scheduleData.type === 'nonExistant') {
    return { type: 'loading' };
  }

  return {
    type: 'loaded',
    result: {
      rawScheduleData: castImmutable(scheduleData.data),
      setRawScheduleData: setScheduleDataPersistent,
    },
  };
}

function getCurrentScheduleData(): ScheduleData | null {
  const currentRawSchedule = getCurrentRawScheduleFromStorage();
  if (currentRawSchedule === null) return null;
  return migrateScheduleData(currentRawSchedule);
}
