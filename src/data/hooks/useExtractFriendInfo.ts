import produce, { Immutable, Draft, castDraft, castImmutable } from 'immer';
import { useEffect, useCallback, useMemo } from 'react';

import { LoadingState } from '../../types';
import {
  FriendData,
  defaultFriendInfo,
  FriendInfo,
  RawFriendScheduleData,
  FriendScheduleData,
} from '../types';
import { ErrorWithFields, softError } from '../../log';

/**
 * Gets the current term friend info based on the current term.
 * If the term friend info for the current term doesn't exist,
 * then this hook also initializes it to an empty value.
 */
export default function useExtractFriendInfo({
  rawFriendScheduleData,
  friendInfo,
  updateFriendData,
}: {
  rawFriendScheduleData: RawFriendScheduleData;
  friendInfo: Immutable<FriendInfo>;
  updateFriendData: (
    applyDraft: (draft: Draft<FriendData>) => void | Immutable<FriendData>
  ) => void;
}): LoadingState<{
  friendScheduleData: Immutable<FriendScheduleData>;
  updateFriendInfo: (
    applyDraft: (draft: Draft<FriendInfo>) => void | Immutable<FriendInfo>
  ) => void;
}> {
  // Ensure that there is a valid term friend info object for the term
  useEffect(() => {
    if (friendInfo === undefined) {
      updateFriendData((draft) => {
        draft.info = castDraft({});
      });
      return;
    }

    for (const friendId of Object.keys(rawFriendScheduleData)) {
      const currentFriendInfo = friendInfo[friendId];
      const correctedFriendInfo =
        currentFriendInfo === undefined ||
        currentFriendInfo.name === undefined ||
        currentFriendInfo.email === undefined
          ? defaultFriendInfo
          : currentFriendInfo;
      if (correctedFriendInfo !== currentFriendInfo) {
        updateFriendData((draft) => {
          draft.info[friendId] = castDraft(correctedFriendInfo);
        });
        return;
      }
    }
  }, [rawFriendScheduleData, friendInfo, updateFriendData]);

  // Create a nested update callback for just the friend info.
  const updateFriendInfo = useCallback(
    (
      applyDraft: (draft: Draft<FriendInfo>) => void | Immutable<FriendInfo>
    ): void => {
      updateFriendData((draft) => {
        const currentFriendInfoDraft = draft.info ?? null;
        if (currentFriendInfoDraft === null) {
          softError(
            new ErrorWithFields({
              message:
                'updateFriendInfo called with invalid info field; ignoring',
              fields: {
                currentFriendInfo: null,
              },
            })
          );
          return;
        }

        draft.info = produce(currentFriendInfoDraft, (subDraft) =>
          castDraft(applyDraft(subDraft))
        );
      });
    },
    [updateFriendData]
  );

  const friendScheduleData =
    useMemo<Immutable<FriendScheduleData> | null>(() => {
      const temp: FriendScheduleData = {};
      if (friendInfo === undefined) return null;

      for (const friendId of Object.keys(rawFriendScheduleData)) {
        const currentFriendInfo = friendInfo[friendId];
        if (
          currentFriendInfo === undefined ||
          currentFriendInfo.email === undefined ||
          currentFriendInfo.name === undefined
        )
          return null;

        const rawFriendScheduleDatum = rawFriendScheduleData[friendId];
        if (
          rawFriendScheduleDatum === undefined ||
          rawFriendScheduleDatum.versions === undefined
        ) {
          softError(
            new ErrorWithFields({
              message: 'an error occurred when accessing friend schedule data',
              fields: {
                friendId,
              },
            })
          );
        } else {
          temp[friendId] = {
            ...currentFriendInfo,
            ...rawFriendScheduleDatum,
          };
        }
      }

      return castImmutable(temp);
    }, [friendInfo, rawFriendScheduleData]);

  if (friendScheduleData === null) {
    return { type: 'loading' };
  }

  return {
    type: 'loaded',
    result: {
      friendScheduleData,
      updateFriendInfo,
    },
  };
}
