import produce, { Draft, Immutable } from 'immer';
import { useCallback } from 'react';

import { FriendData } from '../types';

type HookResult = {
  updateFriendData: (
    applyDraft: (draft: Draft<FriendData>) => void | Immutable<FriendData>
  ) => void;
};

/**
 * Constructs the Immer producer
 * from the raw schedule data state setter.
 * Returns a referentially stable callback function
 * that can be used to update the schedule data using an immer draft:
 * https://immerjs.github.io/immer/produce/
 */
export default function useFriendDataProducer({
  setFriendData,
}: {
  setFriendData: (
    next: ((current: FriendData | null) => FriendData | null) | FriendData
  ) => void;
}): HookResult {
  const updateFriendData = useCallback(
    (applyDraft: (draft: Draft<FriendData>) => void): void =>
      // Here, we use the callback API for the setter function
      // returned by `useState` so that we don't have to re-generate
      // the callback when the state changes
      setFriendData((current: FriendData | null) => {
        // Use `produce` from Immer to combine the current state
        // & caller-supplied callback that modifies the current state
        // to produce the next state
        return produce(current, applyDraft);
      }),
    [setFriendData]
  );

  return { updateFriendData };
}
