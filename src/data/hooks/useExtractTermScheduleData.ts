import produce, { Immutable, Draft, castDraft } from 'immer';
import { useEffect, useCallback } from 'react';

import { ErrorWithFields, softError } from '../../log';
import { LoadingState } from '../../types';
import {
  ScheduleData,
  TermScheduleData,
  defaultTermScheduleData,
} from '../types';

/**
 * Gets the current term schedule data based on the current term.
 * If the term schedule data for the current term doesn't exist,
 * then this hook also initializes it to an empty value.
 */
export default function useExtractTermScheduleData({
  currentTerm,
  scheduleData,
  updateScheduleData,
}: {
  currentTerm: string;
  scheduleData: Immutable<ScheduleData>;
  updateScheduleData: (
    applyDraft: (draft: Draft<ScheduleData>) => void | Immutable<ScheduleData>
  ) => void;
}): LoadingState<{
  termScheduleData: Immutable<TermScheduleData>;
  // This function allows the term schedule data to be edited in 1 of 2 ways:
  // 1. the draft parameter is mutated, and the function returns nothing/void
  // 2. the draft parameter is not mutated
  //    (it can still be used, just not mutated)
  //    and the function returns the new state to use.
  //    This is similar to a traditional setState callback
  updateTermScheduleData: (
    applyDraft: (
      draft: Draft<TermScheduleData>
    ) => void | Immutable<TermScheduleData>
  ) => void;
}> {
  // Ensure that there is a valid term schedule data object for the term
  useEffect(() => {
    const currentTermScheduleData = scheduleData.terms[currentTerm];
    const correctedTermScheduleData =
      currentTermScheduleData === undefined
        ? defaultTermScheduleData
        : currentTermScheduleData;

    if (correctedTermScheduleData !== currentTermScheduleData) {
      updateScheduleData((draft) => {
        draft.terms[currentTerm] = castDraft(correctedTermScheduleData);
      });
    }
  }, [currentTerm, scheduleData.terms, updateScheduleData]);

  const currentTermScheduleData = scheduleData.terms[currentTerm];

  // Create a nested update callback for just the term's schedule data.
  // This should only escape this function
  // when `currentTermScheduleData` is not undefined
  const updateTermScheduleData = useCallback(
    (
      applyDraft: (
        draft: Draft<TermScheduleData>
      ) => void | Immutable<TermScheduleData>
    ): void => {
      updateScheduleData((draft) => {
        const currentTermScheduleDataDraft = draft.terms[currentTerm];
        if (currentTermScheduleDataDraft === undefined) {
          softError(
            new ErrorWithFields({
              message:
                'updateTermScheduleData called on term that does not exist',
              fields: {
                currentTerm,
                currentTermScheduleData: currentTermScheduleDataDraft,
                allTermsInData: Object.keys(draft.terms),
              },
            })
          );
          return;
        }

        draft.terms[currentTerm] = produce(
          currentTermScheduleDataDraft,
          (termScheduleData) => castDraft(applyDraft(termScheduleData))
        );
      });
    },
    [currentTerm, updateScheduleData]
  );

  if (currentTermScheduleData === undefined) {
    return { type: 'loading' };
  }

  return {
    type: 'loaded',
    result: {
      termScheduleData: currentTermScheduleData,
      updateTermScheduleData,
    },
  };
}
