import produce, { Draft, Immutable } from 'immer';
import { useCallback } from 'react';
import { useLocalStorageState } from 'use-local-storage-state';

import { ErrorWithFields } from '../../log';
import { LoadingState } from '../../types';
import { ScheduleData, AnyScheduleData } from '../types';
import useScheduleDataMigrations from './useScheduleDataMigrations';

export const SCHEDULE_DATA_LOCAL_STORAGE_KEY = 'schedule-data';

type HookResult = {
  scheduleData: Immutable<ScheduleData>;
  updateScheduleData: (
    applyDraft: (draft: Draft<ScheduleData>) => void
  ) => void;
};

/**
 * Gets the current schedule data from local storage.
 * Do not call this function in a non-root component;
 * it should only be called once in a root component (i.e. <App>).
 */
export default function useScheduleDataFromStorage(): LoadingState<HookResult> {
  const [scheduleData, setScheduleData, { isPersistent }] =
    useLocalStorageState<AnyScheduleData | null>(
      SCHEDULE_DATA_LOCAL_STORAGE_KEY,
      null
    );

  // This attempts to apply any relevant migrations to the data
  // in an effect hook, and as such, requires us to return a "loading" state
  // until migrations have been applied
  const migrationResult = useScheduleDataMigrations({
    rawScheduleData: scheduleData,
    setScheduleData,
    isPersistent,
  });

  // updateScheduleData is a referentially stable callback function
  // that can be used to update the schedule data using an immer draft:
  // https://immerjs.github.io/immer/produce/
  const updateScheduleData = useCallback(
    (applyDraft: (draft: Draft<ScheduleData>) => void): void =>
      // Here, we use the callback API for the setter function
      // returned by `useState` so that we don't have to re-generate
      // the callback when the state changes
      setScheduleData((current: ScheduleData | null) => {
        if (migrationResult.type !== 'done') {
          // This should not be possible:
          // we return early from the outer hook before we return this callback.
          // The stacktrace will be useful for debugging this.
          throw new ErrorWithFields({
            message:
              'updateScheduleData called when schedule data is not valid',
            fields: {
              migrationResultType: migrationResult.type,
            },
          });
        }

        // Use `produce` from Immer to combine the current state
        // & caller-supplied callback that modifies the current state
        // to produce the next state
        return produce(current, applyDraft);
      }),
    [setScheduleData, migrationResult.type]
  );

  // If the state isn't persistent, then return an error to alert the user:
  if (!isPersistent) {
    // TODO add better contents
    return { type: 'custom', contents: null };
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
      updateScheduleData,
    },
  };
}
