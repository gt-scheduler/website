import { useState, useMemo, useEffect, useCallback } from 'react';

import { useCookie } from '..';
import { Oscar } from '../../beans';
import { softError, ErrorWithFields } from '../../log';
import {
  TermData,
  LoadingState,
  defaultTermDataRaw,
  defaultTermData,
} from '../../types';

/**
 * Gets the current term data from the user's cookies,
 * ensuring it is in a valid state before returning a loaded result.
 * Provides a patch callback that can be used to update the term data
 * and persist it to cookies.
 * Does not support `term` changing between calls to `useTermDataFromCookies`
 * without the parent context unmounting & remounting.
 */
export default function useTermDataFromCookies(
  term: string,
  oscar: Oscar
): LoadingState<[TermData, (patch: Partial<TermData>) => void]> {
  // Persist the term data as a cookie
  const [termDataRaw, setTermDataRaw] = useCookie(term, defaultTermDataRaw);
  const [unrecoverableError, setUnrecoverableError] = useState<Error | null>(
    null
  );

  // Parse the term data
  const parseResult = useMemo(() => parseTermData(termDataRaw), [termDataRaw]);

  // If the term data is not valid, fix it
  useEffect(() => {
    if (parseResult.type === 'error') {
      softError(
        new ErrorWithFields({
          message: 'parsing error for term data',
          source: parseResult.error,
          fields: {
            term,
            termDataRaw,
          },
        })
      );

      // Try storing the invalid data in local storage
      // just in case it wasn't invalid & we're losing valid data:
      /* eslint-disable no-console */
      try {
        const key = `${new Date().toISOString()}-invalid-term-data`;
        window.localStorage.setItem(key, termDataRaw);
        console.log(`Saved previous data to local storage at key '${key}'`);
      } catch (err) {
        console.log('Could not save previous data to local storage:');
        console.error(err);
        console.log(`Previous data:`);
        console.log(termDataRaw);
      }
      /* eslint-enable no-console */

      // Store the default value, ensuring that it is also valid
      // and won't cause an infinite set-state loop
      const parseResultOnDefault = parseTermData(defaultTermDataRaw);
      if (parseResultOnDefault.type === 'error') {
        const err = new ErrorWithFields({
          message: 'default term data is not valid; can not fallback',
          source: parseResultOnDefault.error,
          fields: {
            defaultTermDataRaw,
            term,
          },
        });

        setUnrecoverableError(err);
        softError(err);
      } else {
        setTermDataRaw(defaultTermDataRaw);
      }
    }
  }, [term, oscar, parseResult, setTermDataRaw, termDataRaw]);

  // Create the callback to patch term data.
  // This isn't actually used if the parse didn't succeed,
  // but we have to create it unconditionally since it is a hook.
  const patchTermData = useCallback(
    (patch: Partial<TermData>) => {
      if (parseResult.type === 'error') {
        // This shouldn't be possible to call if the parse didn't succeed,
        // as we don't return this callback from the function.
        throw new ErrorWithFields({
          message: 'patchTermData called when term data is not valid',
          fields: {
            patch,
            term,
            parseResult,
            termDataRaw,
          },
        });
      }

      const updated = JSON.stringify({ ...parseResult.termData, ...patch });

      // Ensure the new term data is valid before committing it
      const updatedParseResult = parseTermData(updated);
      if (updatedParseResult.type === 'error') {
        softError(
          new ErrorWithFields({
            message: 'patched term data is not valid; ignoring update',
            source: updatedParseResult.error,
            fields: {
              patch,
              term,
              termData: parseResult.termData,
              updated,
            },
          })
        );
      } else {
        setTermDataRaw(updated);
      }
    },
    [parseResult, term, setTermDataRaw, termDataRaw]
  );

  // Only consider courses and CRNs that exist
  // (fixes issues where a CRN/course is removed from Oscar
  // after a schedule was made with them).
  // This isn't actually used if the parse didn't succeed,
  // but we have to run it unconditionally since it is a hook.
  const filteredTermData = useMemo<TermData>(() => {
    if (parseResult.type === 'error') {
      return defaultTermData;
    }
    const { termData } = parseResult;

    const courseFilter = (courseId: string): boolean =>
      oscar != null && oscar.findCourse(courseId) != null;
    const crnFilter = (crn: string): boolean =>
      oscar != null && oscar.findSection(crn) != null;

    const desiredCourses = termData.desiredCourses.filter(courseFilter);
    const pinnedCrns = termData.pinnedCrns.filter(crnFilter);
    const excludedCrns = termData.excludedCrns.filter(crnFilter);

    return { ...termData, desiredCourses, pinnedCrns, excludedCrns };
  }, [oscar, parseResult]);

  if (unrecoverableError !== null) {
    return {
      type: 'error',
      error: unrecoverableError,
      stillLoading: false,
      overview: 'an internal assertion failed when attempting to fall back',
    };
  }

  if (parseResult.type === 'error') {
    return {
      type: 'loading',
    };
  }

  // Only return `filteredTermData` and `patchTermData`
  // if `parseResult.type` is `valid`
  if (parseResult.type === 'valid') {
    return {
      type: 'loaded',
      result: [filteredTermData, patchTermData],
    };
  }

  // Unreachable
  throw new ErrorWithFields({
    message: 'unreachable state reached in useTermData',
    fields: {
      term,
      parseResult,
      termDataRaw,
    },
  });
}

type TermDataParseResult =
  | { type: 'error'; error: Error }
  | { type: 'valid'; termData: TermData };

const isStringArray = (field: unknown): field is string[] =>
  field != null &&
  Array.isArray(field) &&
  field.every((elem) => typeof elem === 'string');

const isStringStringMap = (field: unknown): field is Record<string, string> =>
  typeof field === 'object' &&
  field != null &&
  Object.keys(field).every((elem) => typeof elem === 'string') &&
  Object.values(field).every((elem) => typeof elem === 'string');

function parseTermData(rawTermData: string): TermDataParseResult {
  try {
    if (rawTermData === '' || rawTermData === 'undefined') {
      throw new ErrorWithFields({
        message: 'raw term data was empty or "undefined"',
        fields: {
          rawTermData,
        },
      });
    }

    const parsed = JSON.parse(rawTermData) as unknown;
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ErrorWithFields({
        message: 'term data is the wrong type',
        fields: {
          rawTermData,
          termDataType: typeof parsed,
          termData: parsed,
        },
      });
    }

    // Ensure there are valid fields
    const parsedAsRecord = parsed as Record<string, unknown>;
    parsedAsRecord['desiredCourses'] = parsedAsRecord['desiredCourses'] ?? [];
    parsedAsRecord['pinnedCrns'] = parsedAsRecord['pinnedCrns'] ?? [];
    parsedAsRecord['excludedCrns'] = parsedAsRecord['excludedCrns'] ?? [];
    parsedAsRecord['colorMap'] = parsedAsRecord['colorMap'] ?? {};
    parsedAsRecord['sortingOptionIndex'] =
      parsedAsRecord['sortingOptionIndex'] ?? 0;

    const assert = (condition: boolean, message: string): void => {
      if (!condition) {
        throw new ErrorWithFields({
          message: 'assertion failed when validating termData',
          fields: {
            message,
            rawTermData,
            termData: parsed,
          },
        });
      }
    };

    assert(
      isStringArray(parsedAsRecord['desiredCourses']),
      'termData.desiredCourses was not string array'
    );
    assert(
      isStringArray(parsedAsRecord['pinnedCrns']),
      'termData.pinnedCrns was not string array'
    );
    assert(
      isStringArray(parsedAsRecord['excludedCrns']),
      'termData.excludedCrns was not string array'
    );
    assert(
      isStringStringMap(parsedAsRecord['colorMap']),
      'termData.colorMap was not string/string map'
    );
    assert(
      typeof parsedAsRecord['sortingOptionIndex'] === 'number',
      'termData.sortingOptionIndex was not string array'
    );

    return { type: 'valid', termData: parsedAsRecord as TermData };
  } catch (err) {
    if (err instanceof Error) {
      return {
        type: 'error',
        error: err,
      };
    }

    return {
      type: 'error',
      error: new Error(err),
    };
  }
}
