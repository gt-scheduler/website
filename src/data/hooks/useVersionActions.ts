import { castDraft, Draft, Immutable } from 'immer';
import { useCallback } from 'react';

import { softError, ErrorWithFields } from '../../log';
import { defaultSchedule, TermScheduleData } from '../types';

export type HookResult = {
  setCurrentVersion: (nextIndex: number) => void;
  addNewVersion: (name: string, select?: boolean) => void;
  deleteVersion: (index: number) => void;
  renameVersion: (index: number, newName: string) => void;
};

/**
 * Creates a small handful of semantic actions that update the schedule versions
 * from the base `updateTermScheduleData` callback.
 */
export default function useVersionActions({
  updateTermScheduleData,
}: {
  updateTermScheduleData: (
    applyDraft: (
      draft: Draft<TermScheduleData>
    ) => void | Immutable<TermScheduleData>
  ) => void;
}): HookResult {
  // Create a `setCurrentVersion` function
  const setCurrentVersion = useCallback(
    (nextIndex: number): void => {
      updateTermScheduleData((draft) => {
        draft.currentIndex = nextIndex;
      });
    },
    [updateTermScheduleData]
  );

  // Create an `addNewVersion` function
  const addNewVersion = useCallback(
    (name: string, select = false): void => {
      updateTermScheduleData((draft) => {
        draft.versions.push({ name, schedule: castDraft(defaultSchedule) });
        if (select) {
          draft.currentIndex = draft.versions.length - 1;
        }
      });
    },
    [updateTermScheduleData]
  );

  // Create a `deleteVersion` function
  const deleteVersion = useCallback(
    (index: number): void => {
      updateTermScheduleData((draft) => {
        if (index < 0 || index > draft.versions.length - 1) {
          softError(
            new ErrorWithFields({
              message:
                'deleteVersion called with out-of-bounds version index; ignoring',
              fields: {
                allVersionNames: draft.versions.map(({ name }) => name),
                versionCount: draft.versions.length,
                index,
              },
            })
          );
          return;
        }

        draft.versions.splice(index, 1);

        // Check to see if we also need to assign a new current version.
        // This is the case if either:
        // - the current index is after the deleted index,
        //   in which case everything got shifted to the left
        //   so we need to change the current version's index to be 1 less
        // - the current index is the deleted index,
        //   in which case we want to select the previous item
        //   (this is arbitrary; it's just our decided behavior)
        if (draft.currentIndex >= index) {
          // Select the previous version if we can
          const newIndex = Math.max(draft.currentIndex - 1, 0);
          if (draft.versions.length === 0) {
            // The versions list is empty:
            // create a new version called 'Primary'
            draft.currentIndex = 0;
            draft.versions.push({
              name: 'Primary',
              schedule: castDraft(defaultSchedule),
            });
            return;
          }

          // If the versions list isn't empty, then this index must be valid
          draft.currentIndex = newIndex;
        }
      });
    },
    [updateTermScheduleData]
  );

  // Create a `renameVersion` function
  const renameVersion = useCallback(
    (index: number, newName: string): void => {
      updateTermScheduleData((draft) => {
        const reportNotExists = (): void => {
          softError(
            new ErrorWithFields({
              message:
                "renameVersion called with current version name that doesn't exist; ignoring",
              fields: {
                allVersions: Object.keys(draft.versions),
                index,
                allVersionNames: draft.versions.map(({ name }) => name),
                versionCount: draft.versions.length,
                newName,
              },
            })
          );
        };

        if (index < 0 || index > draft.versions.length - 1) {
          reportNotExists();
          return;
        }

        const existingDraft = draft.versions[index];
        if (existingDraft === undefined) {
          reportNotExists();
          return;
        }

        existingDraft.name = newName;
      });
    },
    [updateTermScheduleData]
  );

  return { setCurrentVersion, addNewVersion, deleteVersion, renameVersion };
}
