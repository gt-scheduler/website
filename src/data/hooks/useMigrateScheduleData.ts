import { useState, useEffect, useCallback } from 'react';

import { softError, ErrorWithFields } from '../../log';
import {
  LoadingStateError,
  LoadingStateCustom,
  LoadingState,
} from '../../types';
import migrateScheduleData from '../migrations';
import {
  AnyScheduleData,
  ScheduleData,
  LATEST_SCHEDULE_DATA_VERSION,
} from '../types';

type HookResult = {
  scheduleData: ScheduleData;
  setScheduleData: (
    next: ((current: ScheduleData) => ScheduleData) | ScheduleData
  ) => void;
};

/**
 * Performs an asynchronous migration of the schedule data,
 * ensuring that it is of the latest version's shape
 * using the migrations defined in `src/data/migrations.
 */
export default function useMigrateScheduleData({
  rawScheduleData,
  setRawScheduleData,
}: {
  rawScheduleData: AnyScheduleData | null;
  setRawScheduleData: (
    next:
      | ((current: AnyScheduleData | null) => AnyScheduleData | null)
      | AnyScheduleData
  ) => void;
}): LoadingState<HookResult> {
  const [error, setError] = useState<
    LoadingStateError | LoadingStateCustom | null
  >(null);

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
      setRawScheduleData(updatedScheduleData);
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
  }, [rawScheduleData, setRawScheduleData]);

  // Create the setScheduleData function as a referentially stable callback.
  const setScheduleData = useCallback(
    (next: ((current: ScheduleData) => ScheduleData) | ScheduleData) => {
      if (typeof next !== 'function') setRawScheduleData(next);
      else {
        setRawScheduleData(
          (currentRaw: AnyScheduleData | null): AnyScheduleData | null => {
            if (
              currentRaw === null ||
              currentRaw.version !== LATEST_SCHEDULE_DATA_VERSION
            ) {
              softError(
                new ErrorWithFields({
                  message:
                    "setScheduleData called when schedule data isn't fully migrated",
                  fields: {
                    versionOrNull: currentRaw?.version ?? null,
                  },
                })
              );
              return currentRaw;
            }

            return next(currentRaw);
          }
        );
      }
    },
    [setRawScheduleData]
  );

  if (error !== null) {
    return error;
  }

  if (
    rawScheduleData === null ||
    rawScheduleData.version !== LATEST_SCHEDULE_DATA_VERSION
  ) {
    return { type: 'loading' };
  }

  return {
    type: 'loaded',
    result: {
      scheduleData: rawScheduleData,
      setScheduleData,
    },
  };
}
