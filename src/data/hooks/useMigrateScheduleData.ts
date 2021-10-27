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
 */
export default function useMigrateScheduleData({
  rawScheduleData,
  setScheduleData,
}: {
  rawScheduleData: AnyScheduleData | null;
  setScheduleData: (next: ScheduleData) => void;
}): MigrationResult {
  const [error, setError] = useState<MigrationErrorState | null>(null);

  useEffect(() => {
    // Make sure the data needs migrating
    if (
      rawScheduleData !== null &&
      rawScheduleData.version === LATEST_SCHEDULE_DATA_VERSION
    ) {
      return;
    }

    // Check to see if the version is newer than we can handle
    if (
      rawScheduleData !== null &&
      rawScheduleData.version > LATEST_SCHEDULE_DATA_VERSION
    ) {
      const err = new ErrorWithFields({
        message: 'schedule data version is greater than max supported version',
        fields: {
          version: rawScheduleData.version,
          maxSupportedVersion: LATEST_SCHEDULE_DATA_VERSION,
        },
      });
      softError(err);
      setError({
        type: 'error',
        error: err,
        stillLoading: false,
        overview: 'could not load stored schedule data: unknown format',
      });
      return;
    }

    try {
      const updatedScheduleData = migrateScheduleData(rawScheduleData);
      setScheduleData(updatedScheduleData);
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
  }, [rawScheduleData, setScheduleData]);

  if (error !== null) {
    return { type: 'error', error };
  }

  if (
    rawScheduleData === null ||
    rawScheduleData.version !== LATEST_SCHEDULE_DATA_VERSION
  ) {
    return { type: 'pending' };
  }

  return { type: 'done', result: rawScheduleData };
}
