import { castDraft, Draft, Immutable } from 'immer';
import { useCallback } from 'react';

import { softError, ErrorWithFields } from '../../log';
import {
  defaultSchedule,
  generateScheduleVersionId,
  TermScheduleData,
} from '../types';

export type HookResult = {
  addNewVersion: (name: string, select?: boolean) => string;
  deleteVersion: (id: string) => void;
  renameVersion: (id: string, newName: string) => void;
  cloneVersion: (id: string, newName: string) => void;
  deleteFriendRecord: (versionId: string, friendId: string) => void;
};

/**
 * Creates a small handful of semantic actions that update the schedule versions
 * from the base `updateTermScheduleData` callback.
 */
export default function useVersionActions({
  updateTermScheduleData,
  setVersion,
  currentVersion,
}: {
  updateTermScheduleData: (
    applyDraft: (
      draft: Draft<TermScheduleData>
    ) => void | Immutable<TermScheduleData>
  ) => void;
  setVersion: (next: string) => void;
  currentVersion: string;
}): HookResult {
  // Create an `addNewVersion` function.
  // Returns the ID of the created schedule version.
  const addNewVersion = useCallback(
    (name: string, select = false): string => {
      const id = generateScheduleVersionId();
      updateTermScheduleData((draft) => {
        draft.versions[id] = {
          name,
          friends: {},
          schedule: castDraft(defaultSchedule),
          createdAt: new Date().toISOString(),
        };
      });
      if (select) {
        setVersion(id);
      }
      return id;
    },
    [updateTermScheduleData, setVersion]
  );

  // Create a `deleteVersion` function
  const deleteVersion = useCallback(
    (id: string): void => {
      updateTermScheduleData((draft) => {
        if (draft.versions[id] == null) {
          softError(
            new ErrorWithFields({
              message:
                'deleteVersion called with non-existent version id; ignoring',
              fields: {
                allVersionNames: Object.entries(draft.versions).map(
                  ([versionId, { name }]) => ({ id: versionId, name })
                ),
                versionCount: Object.keys(draft.versions).length,
                id,
              },
            })
          );
          return;
        }

        // Check to see if we also need to assign a new current version.
        // This is the case if the current index is the deleted index,
        // in which case we want to select the previous item
        // (this is arbitrary; it's just our decided behavior)
        if (currentVersion === id) {
          const entries = Object.entries(draft.versions);
          delete draft.versions[id];

          if (
            entries.length === 0 ||
            Object.keys(draft.versions).length === 0
          ) {
            // The versions list is empty:
            // create a new version called 'Primary'
            const newId = generateScheduleVersionId();
            draft.versions[newId] = {
              name: 'Primary',
              friends: {},
              createdAt: new Date().toISOString(),
              schedule: castDraft(defaultSchedule),
            };
            setVersion(newId);
            return;
          }

          // Select the previous version if we can
          // by sorting all versions by their createdAt date.
          const sorted = entries.sort(([, a], [, b]) =>
            a.createdAt > b.createdAt ? 0 : 1
          );
          const indexOfDeleting = sorted.findIndex(
            ([versionId]) => versionId === id
          );
          if (indexOfDeleting === -1) return;

          const newIndex = Math.max(indexOfDeleting - 1, 0);

          // If the remaining versions isn't empty,
          // then this index must be valid
          setVersion(sorted[newIndex]?.[0] ?? '');
        } else {
          // Just delete the version
          delete draft.versions[id];
        }
      });
    },
    [updateTermScheduleData, setVersion, currentVersion]
  );

  // Create a `renameVersion` function
  const renameVersion = useCallback(
    (id: string, newName: string): void => {
      updateTermScheduleData((draft) => {
        const existingDraft = draft.versions[id];
        if (existingDraft === undefined) {
          softError(
            new ErrorWithFields({
              message:
                "renameVersion called with current version name that doesn't exist; ignoring",
              fields: {
                allVersionNames: Object.entries(draft.versions).map(
                  ([versionId, { name }]) => ({ id: versionId, name })
                ),
                id,
                versionCount: Object.keys(draft.versions).length,
                newName,
              },
            })
          );
          return;
        }

        existingDraft.name = newName;
      });
    },
    [updateTermScheduleData]
  );

  const cloneVersion = useCallback(
    (id: string, newName: string): void => {
      const newId = generateScheduleVersionId();
      updateTermScheduleData((draft) => {
        const existingDraft = draft.versions[id];
        if (existingDraft === undefined) {
          softError(
            new ErrorWithFields({
              message:
                "cloneVersion called with current version name that doesn't exist; ignoring",
              fields: {
                allVersionNames: Object.entries(draft.versions).map(
                  ([versionId, { name }]) => ({ id: versionId, name })
                ),
                id,
                versionCount: Object.keys(draft.versions).length,
                newName,
              },
            })
          );
          return;
        }
        draft.versions[newId] = {
          name: newName,
          friends: {},
          schedule: castDraft(existingDraft.schedule),
          createdAt: new Date().toISOString(),
        };
        setVersion(newId);
      });
    },
    [updateTermScheduleData, setVersion]
  );

  const deleteFriendRecord = useCallback(
    (versionId: string, friendId: string): void => {
      updateTermScheduleData((draft) => {
        const existingDraft = draft.versions[versionId];
        if (existingDraft === undefined) {
          softError(
            new ErrorWithFields({
              message:
                "deleteFriendRecord called with version name that doesn't exist; ignoring",
              fields: {
                allVersionNames: Object.entries(draft.versions).map(
                  ([versionId_, { name }]) => ({ id: versionId_, name })
                ),
                versionId,
                versionCount: Object.keys(draft.versions).length,
              },
            })
          );
          return;
        }
        if (friendId in existingDraft.friends) {
          delete existingDraft.friends[friendId];
        } else {
          softError(
            new ErrorWithFields({
              message:
                "deleteFriendRecord called with friend ID that doesn't exist; ignoring",
              fields: {
                allFriendIds: Object.keys(existingDraft.friends),
                friendId,
              },
            })
          );
        }
      });
    },
    [updateTermScheduleData]
  );

  return {
    addNewVersion,
    deleteVersion,
    renameVersion,
    cloneVersion,
    deleteFriendRecord,
  };
}
