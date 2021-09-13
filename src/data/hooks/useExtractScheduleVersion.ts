import produce, { Immutable, Draft, castDraft } from 'immer';
import { useEffect, useCallback } from 'react';

import { ErrorWithFields, softError } from '../../log';
import { LoadingState } from '../../types';
import { TermScheduleData, defaultSchedule, ScheduleVersion } from '../types';

/**
 * Gets the current schedule version from the term schedule data,
 * ensuring that there is a valid current version selected.
 * If the current version isn't valid,
 * then this hook switches to a random existing version.
 * If there are no versions, then this hook automatically creates
 * an empty schedule version called 'Primary' and sets it as the current one.
 */
export default function useExtractScheduleVersion(
  termScheduleData: Immutable<TermScheduleData>,
  updateTermScheduleData: (
    applyDraft: (
      draft: Draft<TermScheduleData>
    ) => void | Immutable<TermScheduleData>
  ) => void
): LoadingState<{
  currentIndex: number;
  scheduleVersion: Immutable<ScheduleVersion>;
  // This function allows the schedule version to be edited in 1 of 2 ways:
  // 1. the draft parameter is mutated, and the function returns nothing/void
  // 2. the draft parameter is not mutated
  //    (it can still be used, just not mutated)
  //    and the function returns the new state to use.
  //    This is similar to a traditional setState callback
  updateScheduleVersion: (
    applyDraft: (
      draft: Draft<ScheduleVersion>
    ) => void | Immutable<ScheduleVersion>
  ) => void;
}> {
  function tryGet<T>(arr: readonly T[], index: number): T | null {
    if (index < 0 || index > arr.length - 1) return null;
    return arr[index] ?? null;
  }

  // Switch the version to any other version if the current one is invalid.
  // If there are no versions, then create a new one called 'Primary'
  const maybeCurrentScheduleVersion = tryGet(
    termScheduleData.versions,
    termScheduleData.currentIndex
  );
  useEffect(() => {
    if (maybeCurrentScheduleVersion === null) {
      updateTermScheduleData((draft) => {
        // Make sure the schedule isn't on the draft either
        if (tryGet(draft.versions, draft.currentIndex) === null) {
          if (draft.versions.length === 0) {
            // Create a new version called 'Primary'
            draft.versions.push({
              name: 'Primary',
              schedule: castDraft(defaultSchedule),
            });
            draft.currentIndex = 0;
          } else {
            // Set the current version to the first one
            draft.currentIndex = 0;
          }
        }
      });
    }
  }, [maybeCurrentScheduleVersion, updateTermScheduleData]);

  // Create a nested update callback for just the schedule version.
  // This should only escape this function
  // when `maybeCurrentScheduleVersion` is not null
  const updateScheduleVersion = useCallback(
    (
      applyDraft: (
        draft: Draft<ScheduleVersion>
      ) => void | Immutable<ScheduleVersion>
    ): void => {
      updateTermScheduleData((draft) => {
        const currentScheduleVersionDraft = tryGet(
          draft.versions,
          draft.currentIndex
        );
        if (currentScheduleVersionDraft === null) {
          softError(
            new ErrorWithFields({
              message:
                'updateScheduleVersion called with invalid current schedule version; ignoring',
              fields: {
                currentIndex: draft.currentIndex,
                currentScheduleVersion: null,
              },
            })
          );
          return;
        }

        draft.versions[draft.currentIndex] = produce(
          currentScheduleVersionDraft,
          (subDraft) => castDraft(applyDraft(subDraft))
        );
      });
    },
    [updateTermScheduleData]
  );

  if (maybeCurrentScheduleVersion === null) {
    return {
      type: 'loading',
    };
  }

  return {
    type: 'loaded',
    result: {
      currentIndex: termScheduleData.currentIndex,
      scheduleVersion: maybeCurrentScheduleVersion,
      updateScheduleVersion,
    },
  };
}
