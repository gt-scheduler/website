import produce, { Immutable, Draft, castDraft } from 'immer';
import { useEffect, useCallback } from 'react';

import { ErrorWithFields, softError } from '../../log';
import { LoadingState } from '../../types';
import { lexicographicCompare } from '../../utils/misc';
import {
  TermScheduleData,
  defaultSchedule,
  ScheduleVersion,
  generateScheduleVersionId,
} from '../types';

/**
 * Gets the current schedule version from the term schedule data,
 * ensuring that there is a valid current version selected.
 * If the current version isn't valid,
 * then this hook switches to a random existing version.
 * If there are no versions, then this hook automatically creates
 * an empty schedule version called 'Primary' and sets it as the current one.
 */
export default function useExtractScheduleVersion({
  termScheduleData,
  updateTermScheduleData,
  currentVersionRaw,
  setVersion,
}: {
  termScheduleData: Immutable<TermScheduleData>;
  updateTermScheduleData: (
    applyDraft: (
      draft: Draft<TermScheduleData>
    ) => void | Immutable<TermScheduleData>
  ) => void;
  currentVersionRaw: string;
  setVersion: (next: string) => void;
}): LoadingState<{
  currentVersion: string;
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
  // Switch the version to any other version if the current one is invalid.
  // If there are no versions, then create a new one called 'Primary'
  const maybeCurrentScheduleVersion =
    termScheduleData.versions[currentVersionRaw] ?? null;
  useEffect(() => {
    if (maybeCurrentScheduleVersion === null) {
      updateTermScheduleData((draft) => {
        // Make sure the schedule isn't on the draft either
        if (draft.versions[currentVersionRaw] == null) {
          if (Object.keys(draft.versions).length === 0) {
            // Create a new version called 'Primary'
            const id = generateScheduleVersionId();
            draft.versions[id] = {
              name: 'Primary',
              friends: {},
              createdAt: new Date().toISOString(),
              schedule: castDraft(defaultSchedule),
            };
            setVersion(id);
          } else {
            // Set the current version to the first one,
            // sorted by their createdAt time
            const allVersions = Object.entries(draft.versions).sort(
              ([, a], [, b]) => lexicographicCompare(a.createdAt, b.createdAt)
            );
            setVersion(allVersions[0]?.[0] as string);
          }
        }
      });
    }
  }, [
    currentVersionRaw,
    maybeCurrentScheduleVersion,
    updateTermScheduleData,
    setVersion,
  ]);

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
        const currentScheduleVersionDraft =
          draft.versions[currentVersionRaw] ?? null;
        if (currentScheduleVersionDraft === null) {
          softError(
            new ErrorWithFields({
              message:
                'updateScheduleVersion called with invalid current schedule version; ignoring',
              fields: {
                currentVersionRaw,
                currentScheduleVersion: null,
              },
            })
          );
          return;
        }

        draft.versions[currentVersionRaw] = produce(
          currentScheduleVersionDraft,
          (subDraft) => castDraft(applyDraft(subDraft))
        );
      });
    },
    [updateTermScheduleData, currentVersionRaw]
  );

  if (maybeCurrentScheduleVersion === null) {
    return {
      type: 'loading',
    };
  }

  return {
    type: 'loaded',
    result: {
      currentVersion: currentVersionRaw,
      scheduleVersion: maybeCurrentScheduleVersion,
      updateScheduleVersion,
    },
  };
}
