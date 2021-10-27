import { Immutable } from 'immer';
import { useCallback, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { renderDataNotPersistentNotification } from '../../components/DataNotPersistentNotification';
import { ErrorWithFields } from '../../log';
import { LoadingState } from '../../types';
import {
  ScheduleData,
  AnyScheduleData,
  LATEST_SCHEDULE_DATA_VERSION,
} from '../types';
import useScheduleDataMigrations from './useScheduleDataMigrations';

export const SCHEDULE_DATA_LOCAL_STORAGE_KEY = 'schedule-data';

type HookResult = {
  scheduleData: Immutable<ScheduleData>;
  setScheduleData: (
    next: ((current: ScheduleData) => ScheduleData) | ScheduleData
  ) => void;
};

/**
 * Gets the current schedule data from local storage.
 * Do not call this function in a non-root component;
 * it should only be called once in a root component (i.e. <App>).
 */
export default function useScheduleDataFromStorage(): LoadingState<HookResult> {
  const [rawScheduleData, setRawScheduleData, { isPersistent }] =
    useLocalStorageState<AnyScheduleData | null>(
      SCHEDULE_DATA_LOCAL_STORAGE_KEY,
      null
    );

  // This attempts to apply any relevant migrations to the data
  // in an effect hook, and as such, requires us to return a "loading" state
  // until migrations have been applied
  const migrationResult = useScheduleDataMigrations({
    rawScheduleData,
    setScheduleData: setRawScheduleData,
  });

  const [userAcceptedNonPersistence, setUserAcceptedNonPersistence] =
    useState(false);

  // updateScheduleData is a referentially stable callback function
  // that can be used to update the schedule data .
  const setScheduleData = useCallback(
    (next: ((current: ScheduleData) => ScheduleData) | ScheduleData): void => {
      setRawScheduleData(
        (current: AnyScheduleData | null): AnyScheduleData | null => {
          if (
            current === null ||
            current.version !== LATEST_SCHEDULE_DATA_VERSION
          ) {
            // This should not be possible:
            // we return early from the outer hook
            // before we return this callback.
            // The stacktrace will be useful for debugging this.
            throw new ErrorWithFields({
              message:
                'updateScheduleData called when schedule data is not valid',
              fields: {
                currentVersionOrNull: current?.version,
              },
            });
          }

          if (typeof next === 'function') {
            return next(current);
          }

          return next;
        }
      );
    },

    [setRawScheduleData]
  );

  // If the state isn't persistent, then return an error to alert the user
  // requiring them to acknowledge this before continuing
  if (!isPersistent && !userAcceptedNonPersistence) {
    return {
      type: 'custom',
      contents: renderDataNotPersistentNotification({
        onAccept: (): void => {
          setUserAcceptedNonPersistence(true);
        },
      }),
    };
  }

  // The data is still "loading" -- it is waiting for the migration
  // useEffect hook to apply migrations as needed
  if (migrationResult.type === 'pending') {
    return { type: 'loading' };
  }

  // The migration might have failed: in this case, there's nothing we can do.
  if (migrationResult.type === 'error') {
    return migrationResult.error;
  }

  return {
    type: 'loaded',
    result: {
      scheduleData: migrationResult.result,
      setScheduleData,
    },
  };
}
