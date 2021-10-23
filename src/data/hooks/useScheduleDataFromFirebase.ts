import { Immutable, Draft } from 'immer';

import { SignedIn } from '../../contexts/account';
import { LoadingState } from '../../types';
import { ScheduleData } from '../types';

type HookResult = {
  scheduleData: Immutable<ScheduleData>;
  updateScheduleData: (
    applyDraft: (draft: Draft<ScheduleData>) => void
  ) => void;
};

/**
 * Gets the current schedule data from Firebase.
 * Do not call this function in a non-root component;
 * it should only be called once in a root component (i.e. <App>).
 */
export default function useScheduleDataFromFirebase(
  _account: SignedIn
): LoadingState<HookResult> {
  // TODO implement
  return { type: 'loading' };
}
