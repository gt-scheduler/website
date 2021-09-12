import produce, { Immutable, Draft, castDraft } from 'immer';
import { useEffect, useCallback } from 'react';

import { ErrorWithFields } from '../../log';
import { LoadingState } from '../../types';
import { TermScheduleData, Schedule, defaultSchedule } from '../types';

export default function useExtractSchedule(
  termScheduleData: Immutable<TermScheduleData>,
  updateTermScheduleData: (
    applyDraft: (
      draft: Draft<TermScheduleData>
    ) => void | Immutable<TermScheduleData>
  ) => void
): LoadingState<{
  currentVersion: string;
  schedule: Immutable<Schedule>;
  updateSchedule: (
    applyDraft: (draft: Draft<Schedule>) => void | Immutable<Schedule>
  ) => void;
}> {
  // Switch the version to any other version if the current one is invalid.
  // If there are no versions, then create a new one called 'Primary'
  useEffect(() => {
    if (
      termScheduleData.versions[termScheduleData.currentVersion] === undefined
    ) {
      const allVersions = Object.keys(termScheduleData.versions);
      if (allVersions.length > 0) {
        // Set the current version to the first version in the list
        updateTermScheduleData((draft) => {
          draft.currentVersion = allVersions[0] as string;
        });
      } else {
        // Create a new version called 'Primary'
        updateTermScheduleData((draft) => {
          draft.currentVersion = 'Primary';
          draft.versions['Primary'] = castDraft(defaultSchedule);
        });
      }
    }
  }, [
    termScheduleData.versions,
    termScheduleData.currentVersion,
    updateTermScheduleData,
  ]);

  const { currentVersion } = termScheduleData;
  const currentSchedule = termScheduleData.versions[currentVersion];

  // Create a nested update callback for just the schedule.
  // This should only escape this function
  // when `currentSchedule` is not undefined
  const updateSchedule = useCallback(
    (
      applyDraft: (draft: Draft<Schedule>) => void | Immutable<Schedule>
    ): void => {
      if (currentSchedule === undefined) {
        throw new ErrorWithFields({
          message: 'updateSchedule called with invalid current schedule',
          fields: {
            currentVersion,
            currentSchedule,
          },
        });
      }

      updateTermScheduleData((draft) => {
        const currentScheduleDraft = draft.versions[currentVersion];
        if (currentScheduleDraft === undefined) {
          throw new ErrorWithFields({
            message: 'updateSchedule called on version that does not exist',
            fields: {
              currentVersion,
              currentSchedule,
              allVersions: Object.keys(draft.versions),
            },
          });
        }

        draft.versions[currentVersion] = produce(
          currentScheduleDraft,
          (scheduleDraft) => castDraft(applyDraft(scheduleDraft))
        );
      });
    },
    [currentVersion, currentSchedule, updateTermScheduleData]
  );

  if (currentSchedule === undefined) {
    return {
      type: 'loading',
    };
  }

  return {
    type: 'loaded',
    result: {
      currentVersion,
      schedule: currentSchedule,
      updateSchedule,
    },
  };
}
