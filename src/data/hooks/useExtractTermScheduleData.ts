import produce, { Immutable, Draft, castDraft } from 'immer';
import { useEffect, useCallback } from 'react';

import { ErrorWithFields, softError } from '../../log';
import { NonEmptyArray, LoadingState } from '../../types';
import {
  ScheduleData,
  TermScheduleData,
  defaultTermScheduleData,
} from '../types';

/**
 * Gets the current term schedule data based on the current term,
 * ensuring that there is a valid current term selected.
 * If the current term isn't valid (i.e. empty or not in the `terms` array),
 * then it is set to the most recent term (which is the first item in `terms`).
 * If the term schedule data for the current term doesn't exist,
 * then this hook also initializes it to an empty value.
 */
export default function useExtractTermScheduleData(
  terms: NonEmptyArray<string>,
  scheduleData: Immutable<ScheduleData>,
  updateScheduleData: (
    applyDraft: (draft: Draft<ScheduleData>) => void | Immutable<ScheduleData>
  ) => void
): LoadingState<{
  currentTerm: string;
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
  // Set the term to be the first one if it is unset or no longer valid.
  // Also, ensure that there is a valid term schedule data object for that term
  useEffect(() => {
    const mostRecentTerm = terms[0];
    const correctedTerm = !isValidTerm(scheduleData.currentTerm, terms)
      ? mostRecentTerm
      : scheduleData.currentTerm;

    const currentTermScheduleData = scheduleData.terms[correctedTerm];
    const correctedTermScheduleData =
      currentTermScheduleData === undefined
        ? defaultTermScheduleData
        : currentTermScheduleData;

    if (
      correctedTerm !== scheduleData.currentTerm ||
      correctedTermScheduleData !== currentTermScheduleData
    ) {
      updateScheduleData((draft) => {
        draft.currentTerm = correctedTerm;
        draft.terms[correctedTerm] = castDraft(correctedTermScheduleData);
      });
    }
  }, [scheduleData.currentTerm, scheduleData.terms, terms, updateScheduleData]);

  const { currentTerm } = scheduleData;
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
                currentTermScheduleData,
                terms,
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
    [currentTerm, terms, currentTermScheduleData, updateScheduleData]
  );

  if (
    !isValidTerm(currentTerm, terms) ||
    currentTermScheduleData === undefined
  ) {
    return { type: 'loading' };
  }

  return {
    type: 'loaded',
    result: {
      currentTerm,
      termScheduleData: currentTermScheduleData,
      updateTermScheduleData,
    },
  };
}

/**
 * Determines if the given term is considered "valid";
 * helps to recover from invalid cookie values if possible.
 */
export function isValidTerm(term: string, terms: string[]): boolean {
  return term !== '' && term !== 'undefined' && terms.includes(term);
}
