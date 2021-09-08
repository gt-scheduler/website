import { useState, useEffect } from 'react';

import { useCookie } from '..';
import { ErrorWithFields, softError } from '../../log';
import { LoadingState } from '../../types';

/**
 * Gets the currently selected term from cookies,
 * ensuring it is valid before returning a loaded result.
 */
export default function useTermFromCookies(
  terms: string[]
): LoadingState<[string, (next: string) => void]> {
  const [term, setTerm] = useCookie('term', terms[0] ?? '');
  const [unrecoverableError, setUnrecoverableError] = useState<Error | null>(
    null
  );

  // Set the term to be the first one if it is unset
  useEffect(() => {
    if (!isValidTerm(term, terms)) {
      const [recentTerm] = terms as [string];
      if (isValidTerm(recentTerm, terms)) {
        setTerm(recentTerm);
      } else {
        const err = new ErrorWithFields({
          message: 'most recent term is not valid; can not fallback',
          fields: {
            recentTerm,
            terms,
          },
        });

        setUnrecoverableError(err);
        softError(err);
      }
    }
  }, [terms, term, setTerm]);

  if (unrecoverableError !== null) {
    return {
      type: 'error',
      error: unrecoverableError,
      stillLoading: false,
      overview: 'an internal assertion failed when attempting to fall back',
    };
  }

  if (!isValidTerm(term, terms)) {
    return {
      type: 'loading',
    };
  }

  return {
    type: 'loaded',
    result: [term, setTerm],
  };
}

/**
 * Determines if the given term is considered "valid";
 * helps to recover from invalid cookie values if possible.
 */
function isValidTerm(term: string, terms: string[]): boolean {
  return term !== '' && term !== 'undefined' && terms.includes(term);
}
