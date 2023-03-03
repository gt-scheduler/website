import produce, { Immutable, Draft, castDraft } from 'immer';
import { useEffect, useCallback } from 'react';

import { LoadingState } from '../../types';
import {
  FriendData,
  defaultFriendInfo,
  FriendInfos,
  FriendIds,
} from '../types';
import { ErrorWithFields, softError } from '../../log';

/**
 * Gets the current term friend info based on the current term.
 * If the term friend info for the current term doesn't exist,
 * then this hook also initializes it to an empty value.
 */
export default function useExtractFriendTermInfo({
  termFriendData,
  friendInfo,
  updateFriendData,
}: {
  termFriendData: Immutable<FriendIds>;
  friendInfo: Immutable<FriendInfos>;
  updateFriendData: (
    applyDraft: (draft: Draft<FriendData>) => void | Immutable<FriendData>
  ) => void;
}): LoadingState<{
  termFriendInfo: Immutable<FriendInfos>;
  updateFriendInfo: (
    applyDraft: (draft: Draft<FriendInfos>) => void | Immutable<FriendInfos>
  ) => void;
}> {
  // Ensure that there is a valid term friend info object for the term
  useEffect(() => {
    for (const friendId of Object.keys(termFriendData)) {
      const currentFriendInfo = friendInfo[friendId];
      const correctedFriendInfo =
        currentFriendInfo === undefined ||
        currentFriendInfo.nickname === undefined ||
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
  }, [termFriendData, friendInfo, updateFriendData]);

  // Create a nested update callback for just the friend info.
  const updateFriendInfo = useCallback(
    (
      applyDraft: (draft: Draft<FriendInfos>) => void | Immutable<FriendInfos>
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

  const termFriendInfo: FriendInfos = {};
  for (const friendId of Object.keys(termFriendData)) {
    const currentFriendInfo = friendInfo[friendId];
    if (
      currentFriendInfo === undefined ||
      currentFriendInfo.email === undefined ||
      currentFriendInfo.nickname === undefined
    )
      return { type: 'loading' };
    termFriendInfo[friendId] = currentFriendInfo;
  }

  return {
    type: 'loaded',
    result: {
      termFriendInfo,
      updateFriendInfo,
    },
  };
}
