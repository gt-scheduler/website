import produce, { Draft, Immutable } from 'immer';
import { useCallback } from 'react';

import { ScheduleData } from '../types';

type HookResult = {
  updateScheduleData: (
    applyDraft: (draft: Draft<ScheduleData>) => void | Immutable<ScheduleData>
  ) => void;
};

/**
 * Constructs the Immer producer
 * from the raw schedule data state setter.
 * Returns a referentially stable callback function
 * that can be used to update the schedule data using an immer draft:
 * https://immerjs.github.io/immer/produce/
 */
export default function useScheduleDataProducer({
  setScheduleData,
}: {
  setScheduleData: (
    next: ((current: ScheduleData) => ScheduleData) | ScheduleData
  ) => void;
}): HookResult {
  const updateScheduleData = useCallback(
    (applyDraft: (draft: Draft<ScheduleData>) => void): void =>
      // Here, we use the callback API for the setter function
      // returned by `useState` so that we don't have to re-generate
      // the callback when the state changes
      setScheduleData((current: ScheduleData) => {
        // Use `produce` from Immer to combine the current state
        // & caller-supplied callback that modifies the current state
        // to produce the next state
        return produce(current, applyDraft);
      }),
    [setScheduleData]
  );

  return { updateScheduleData };
}
