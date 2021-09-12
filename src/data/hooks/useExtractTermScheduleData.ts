import produce, { Immutable, Draft, castDraft } from 'immer';
import { useEffect, useCallback } from 'react';

import { ErrorWithFields } from '../../log';
import { NonEmptyArray, LoadingState } from '../../types';
import {
  ScheduleData,
  TermScheduleData,
  defaultTermScheduleData,
} from '../types';

export default function useExtractTermScheduleData(
  terms: NonEmptyArray<string>,
  scheduleData: Immutable<ScheduleData>,
  updateScheduleData: (
    applyDraft: (draft: Draft<ScheduleData>) => void | Immutable<ScheduleData>
  ) => void
): LoadingState<{
  currentTerm: string;
  termScheduleData: Immutable<TermScheduleData>;
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
      if (
        !isValidTerm(currentTerm, terms) ||
        currentTermScheduleData === undefined
      ) {
        throw new ErrorWithFields({
          message:
            'updateTermScheduleData called with invalid current term schedule data',
          fields: {
            currentTerm,
            currentTermScheduleData,
            terms,
          },
        });
      }

      updateScheduleData((draft) => {
        const currentTermScheduleDataDraft = draft.terms[currentTerm];
        if (currentTermScheduleDataDraft === undefined) {
          throw new ErrorWithFields({
            message:
              'updateTermScheduleData called on term that does not exist',
            fields: {
              currentTerm,
              currentTermScheduleData,
              terms,
              allTermsInData: Object.keys(draft.terms),
            },
          });
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
