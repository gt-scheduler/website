import { useEffect } from 'react';

import { NonEmptyArray, LoadingState } from '../../types';

type HookResult = {
  currentTerm: string;
};

/**
 * Ensures that there is a valid current term selected.
 * If the current term isn't valid (i.e. empty or not in the `terms` array),
 * then it is set to the most recent term (which is the first item in `terms`).
 */
export default function useEnsureValidTerm({
  terms,
  setTerm,
  currentTermRaw,
}: {
  terms: NonEmptyArray<string>;
  setTerm: (next: string) => void;
  currentTermRaw: string;
}): LoadingState<HookResult> {
  // Set the term to be the first one if it is unset or no longer valid.
  useEffect(() => {
    const mostRecentTerm = terms[0];
    const correctedTerm = !isValidTerm(currentTermRaw, terms)
      ? mostRecentTerm
      : currentTermRaw;

    if (correctedTerm !== currentTermRaw) {
      setTerm(correctedTerm);
    }
  }, [currentTermRaw, terms, setTerm]);

  if (!isValidTerm(currentTermRaw, terms)) {
    return { type: 'loading' };
  }

  return {
    type: 'loaded',
    result: {
      currentTerm: currentTermRaw,
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
