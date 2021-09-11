import { useState, useEffect } from 'react';

import { softError, ErrorWithFields } from '../../log';
import { LoadingStateError, LoadingStateCustom } from '../../types';
import migrateScheduleData from '../migrations';
import {
  AnyScheduleData,
  ScheduleData,
  LATEST_SCHEDULE_DATA_VERSION,
} from '../types';

export type MigrationErrorState = LoadingStateError | LoadingStateCustom;
export type MigrationResult =
  | { type: 'done'; result: ScheduleData }
  | { type: 'pending' }
  | { type: 'error'; error: MigrationErrorState };

/**
 * Performs an asynchronous migration of the schedule data,
 * ensuring that it is of the latest version's shape
 * using the migrations defined in `src/data/migrations.
 * If `isPersistent` is true, then this function always returns `loading`
 * and doesn't do anything
 */
export default function useScheduleDataMigrations({
  rawScheduleData,
  setScheduleData,
  isPersistent,
}: {
  rawScheduleData: AnyScheduleData | null;
  setScheduleData: (next: ScheduleData) => void;
  isPersistent: boolean;
}): MigrationResult {
  const [done, setDone] = useState<boolean>(false);
  const [error, setError] = useState<MigrationErrorState | null>(null);

  useEffect(() => {
    if (done || !isPersistent) return;

    try {
      const updatedScheduleData = migrateScheduleData(rawScheduleData);
      setScheduleData(updatedScheduleData);
      setDone(true);
    } catch (err) {
      // An error occurred: the safe thing to do is report to the user & stop
      const newError = new ErrorWithFields({
        source: err,
        message: 'an error occurred when loading schedule data',
      });

      softError(newError);
      setError({
        type: 'error',
        error: newError,
        stillLoading: false,
        overview: 'could not convert stored schedule data to latest version',
      });
    }
  }, [done, isPersistent, rawScheduleData, setScheduleData]);

  if (error !== null) {
    return { type: 'error', error };
  }

  if (!done) {
    return { type: 'pending' };
  }

  if (
    rawScheduleData === null ||
    rawScheduleData.version !== LATEST_SCHEDULE_DATA_VERSION
  ) {
    return {
      type: 'error',
      error: {
        type: 'error',
        overview: 'an internal assertion failed; could not load schedule data',
        stillLoading: false,
        error: new ErrorWithFields({
          message:
            'rawScheduleData was not of latest version even after migrations were marked as done',
        }),
      },
    };
  }

  return { type: 'done', result: rawScheduleData };
}
