import produce, { Immutable, Draft, castDraft } from 'immer';
import { useEffect, useCallback } from 'react';

import { LoadingState } from '../../types';
import {
  FriendData,
  defaultFriendTermData,
  FriendTermData,
  FriendIds,
} from '../types';
import { ErrorWithFields, softError } from '../../log';

/**
 * Gets the current term friend data based on the current term.
 * If the term friend data for the current term doesn't exist,
 * then this hook also initializes it to an empty value.
 */
export default function useExtractFriendTermData({
  currentTerm,
  rawFriendData,
  updateFriendData,
}: {
  currentTerm: string;
  rawFriendData: Immutable<FriendData>;
  updateFriendData: (
    applyDraft: (draft: Draft<FriendData>) => void | Immutable<FriendData>
  ) => void;
}): LoadingState<{
  termFriendData: Immutable<FriendIds>;
  updateFriendTermData: (
    applyDraft: (
      draft: Draft<FriendTermData>
    ) => void | Immutable<FriendTermData>
  ) => void;
}> {
  // Ensure that there is a valid term friend data object for the term
  useEffect(() => {
    if (rawFriendData.terms === undefined) {
      return updateFriendData((draft) => {
        draft.terms = { [currentTerm]: castDraft(defaultFriendTermData) };
      });
    }
    const currentFriendTermData = rawFriendData.terms[currentTerm];
    const correctedFriendTermData =
      currentFriendTermData === undefined ||
      currentFriendTermData.accessibleSchedules === undefined
        ? defaultFriendTermData
        : currentFriendTermData;

    if (correctedFriendTermData !== currentFriendTermData) {
      updateFriendData((draft) => {
        draft.terms[currentTerm] = castDraft(correctedFriendTermData);
      });
    }
  }, [currentTerm, rawFriendData.terms, updateFriendData]);

  // Create a nested update callback for just the friend term data.
  const updateFriendTermData = useCallback(
    (
      applyDraft: (
        draft: Draft<FriendTermData>
      ) => void | Immutable<FriendTermData>
    ): void => {
      updateFriendData((draft) => {
        const currentFriendTermDataDraft = draft.terms[currentTerm] ?? null;
        if (
          currentFriendTermDataDraft === null ||
          currentFriendTermDataDraft.accessibleSchedules === undefined
        ) {
          softError(
            new ErrorWithFields({
              message:
                'updateFriendTermData called with invalid current term; ignoring',
              fields: {
                currentTerm,
                currentFriendTermData: null,
              },
            })
          );
          return;
        }

        draft.terms[currentTerm] = produce(
          currentFriendTermDataDraft,
          (subDraft) => castDraft(applyDraft(subDraft))
        );
      });
    },
    [updateFriendData, currentTerm]
  );

  const currentFriendTermData = rawFriendData.terms
    ? rawFriendData.terms[currentTerm]
    : undefined;

  if (
    currentFriendTermData === undefined ||
    currentFriendTermData.accessibleSchedules === undefined
  ) {
    return { type: 'loading' };
  }

  return {
    type: 'loaded',
    result: {
      termFriendData: currentFriendTermData.accessibleSchedules,
      updateFriendTermData,
    },
  };
}
