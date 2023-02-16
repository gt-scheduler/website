import { Immutable, castImmutable, castDraft } from 'immer';
import { useCallback, useEffect, useState } from 'react';

import { SignedIn } from '../../contexts/account';
import { ErrorWithFields, softError } from '../../log';
import {
  LoadingState,
  LoadingStateCustom,
  LoadingStateError,
} from '../../types';
import { db, isAuthEnabled, friendsCollection } from '../firebase';
import { FriendsData, defaultFriendsData } from '../types';
import { getCurrentFriendsFromStorage } from './useFriendsDataFromStorage';

type HookResult = {
  rawFriendData: Immutable<FriendsData> | null;
  setFriendScheduleData: (
    next: ((current: FriendsData | null) => FriendsData | null) | FriendsData
  ) => void;
};

type FriendDataState = Loading | NonExistant | FriendDataExists;

type Loading = {
  type: 'loading';
};
type NonExistant = {
  type: 'nonExistant';
};

type FriendDataExists = {
  type: 'exists';
  data: FriendsData;
};

/**
 * Gets the current schedule data from Firebase.
 * Do not call this function in a non-root component;
 * it should only be called once in a root component (i.e. <App>).
 */
export default function useRawFriendsDataFromFirebase(
  account: SignedIn
): LoadingState<HookResult> {
  const [friendData, setFriendData] = useState<FriendDataState>({
    type: 'loading',
  });

  const [permanentError, setPermanentError] = useState<
    LoadingStateError | LoadingStateCustom | null
  >(null);
  useEffect(() => {
    if (!isAuthEnabled) return undefined;

    const removeFriendsSnapshotListener = friendsCollection
      .doc(account.id)
      .onSnapshot(
        {
          // Ignore metadata changes
          includeMetadataChanges: false,
        },
        (doc) => {
          const data = doc.data();
          if (data == null) {
            setFriendData({ type: 'nonExistant' });
          } else {
            setFriendData({
              type: 'exists',
              data: doc.data() as FriendsData,
            });
          }
        }
      );
    return (): void => {
      removeFriendsSnapshotListener();
    };
  }, [account.id]);

  const setFriendDataPersistent = useCallback(
    (
      next: ((current: FriendsData | null) => FriendsData | null) | FriendsData
    ): void => {
      let nextFriendData;
      if (typeof next === 'function') {
        let currentFriendData;
        if (friendData.type === 'exists') {
          currentFriendData = friendData.data;
        } else {
          currentFriendData = null;
        }
        nextFriendData = next(currentFriendData);
      } else {
        nextFriendData = next;
      }
      if (nextFriendData === null) return;

      // Eagerly set the friend data here as well.
      // It would be okay to wait until Firebase updates the state for us,
      // (which it will do, even before the network calls are made),
      // but this allows a window where state can react based on stale state.
      setFriendData({ type: 'exists', data: nextFriendData });

      friendsCollection
        .doc(account.id)
        .set(nextFriendData)
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
    [account.id, friendData]
  );

  // Perform a transaction if the type is non-existent,
  // trying to pull existing data from local storage
  // and storing it in Firebase.
  // This serves to provide the initial account data.
  useEffect(() => {
    if (!isAuthEnabled) return;

    if (friendData.type === 'nonExistant') {
      // Imperatively get the latest migrated data
      let currentFriendsData: Immutable<FriendsData>;
      try {
        currentFriendsData = getFriendData() ?? defaultFriendsData;
      } catch (err) {
        softError(
          new ErrorWithFields({
            message:
              'failed to imperatively get current friend data during account seeding',
            source: err,
            fields: {
              accountId: account.id,
            },
          })
        );
        currentFriendsData = defaultFriendsData;
      }

      // Start the transaction
      db.runTransaction(async (transaction) => {
        const currentDoc = await transaction.get(
          friendsCollection.doc(account.id)
        );
        if (currentDoc.exists) return;
        transaction.set(
          friendsCollection.doc(account.id),
          castDraft(currentFriendsData)
        );
      }).catch((err) => {
        // Send the error to Sentry
        const error = new ErrorWithFields({
          message: 'an error occurred while initializing account friend data',
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
  }, [account.id, friendData.type]);

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

  if (friendData.type === 'loading' || friendData.type === 'nonExistant') {
    return { type: 'loading' };
  }

  return {
    type: 'loaded',
    result: {
      rawFriendData: castImmutable(friendData.data),
      setFriendScheduleData: setFriendDataPersistent,
    },
  };
}

function getFriendData(): FriendsData | null {
  const currentRawFriends = getCurrentFriendsFromStorage();
  if (currentRawFriends === null) return null;
  return currentRawFriends;
}
