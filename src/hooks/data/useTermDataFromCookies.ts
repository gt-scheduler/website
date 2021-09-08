import { useState, useMemo, useEffect, useCallback } from 'react';

import { useCookie } from '..';
import { Oscar } from '../../beans';
import { softError, ErrorWithFields } from '../../log';
import {
  TermData,
  LoadingState,
  defaultTermDataRaw,
  defaultTermData,
  LoadingStateError,
  LoadingStateCustom,
  NonEmptyArray,
} from '../../types';
import { renderTermDataFallbackNotification } from '../../components/TermDataFallbackNotification';

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
  const [persistentErrorState, setPersistentErrorState] = useState<
    LoadingStateError | LoadingStateCustom | null
  >(null);

  // Parse & validate the term data
  const parseResult = useMemo<TermDataValidationResult>(() => {
    const parsed = parseTermData(termDataRaw);
    if (parsed.type === 'error') {
      return {
        type: 'error',
        errors: [parsed.error],
        // Fall back to the default value here
        fallback: defaultTermData,
      };
    }

    return validateTermData(parsed.parsed, termDataRaw);
  }, [termDataRaw]);

  // If the term data is not valid, store the invalid data
  // & present the user with the option of fixing it
  useEffect(() => {
    if (parseResult.type === 'error') {
      parseResult.errors.forEach((err) => {
        softError(
          new ErrorWithFields({
            message: 'parsing error for term data',
            source: err,
            fields: {
              term,
              termDataRaw,
              fallback: parseResult.fallback,
            },
          })
        );
      });

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

      // Stringify the fallback value
      let fallbackTermDataRaw: string;
      try {
        fallbackTermDataRaw = JSON.stringify(parseResult.fallback);
      } catch (error) {
        const err = new ErrorWithFields({
          message: 'error serializing fallback term data to JSON',
          source: error,
          fields: {
            term,
            termDataRaw,
            fallback: parseResult.fallback,
          },
        });
        setPersistentErrorState({
          type: 'error',
          overview: 'could not prepare fallback term data to save',
          error: err,
          stillLoading: false,
        });
        softError(err);
        return;
      }

      // Some fallback scenarios present an easy choice
      if (termDataRaw === '' || termDataRaw === 'undefined') {
        setTermDataRaw(fallbackTermDataRaw);
        return;
      }

      // Show an alert to the user, allowing them to choose whether to fall back
      setPersistentErrorState({
        type: 'custom',
        contents: renderTermDataFallbackNotification({
          originalRaw: termDataRaw,
          fallbackRaw: fallbackTermDataRaw,
          errors: parseResult.errors,
          term,
          onAccept: (): void => {
            // The user accepted the fallback, set the state
            setTermDataRaw(fallbackTermDataRaw);
            setPersistentErrorState(null);
          },
        }),
      });
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

      // Ensure the new term data is valid before committing it
      const updated = { ...parseResult.termData, ...patch };
      const validationResult = validateTermData(updated);
      if (validationResult.type === 'error') {
        validationResult.errors.forEach((err) => {
          softError(
            new ErrorWithFields({
              message: 'patched term data is not valid; ignoring update',
              source: err,
              fields: {
                patch,
                term,
                termData: parseResult.termData,
                updated,
              },
            })
          );
        });
        return;
      }

      // Serialize the updated term data to a string
      let updatedRawTermData: string;
      try {
        updatedRawTermData = JSON.stringify(updated);
      } catch (error) {
        softError(
          new ErrorWithFields({
            message: 'error serializing patched term data to JSON',
            source: error,
            fields: {
              patch,
              term,
              termDataRaw,
              termData: parseResult.termData,
            },
          })
        );
        return;
      }

      setTermDataRaw(updatedRawTermData);
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

  if (persistentErrorState !== null) {
    return persistentErrorState;
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
  | { type: 'parsed'; parsed: unknown };

/**
 * Parses raw term data from its string representation to the parsed JSON
 */
function parseTermData(rawTermData: string): TermDataParseResult {
  if (rawTermData === '' || rawTermData === 'undefined') {
    return {
      type: 'error',
      error: new ErrorWithFields({
        message: 'raw term data was empty or "undefined"',
        fields: {
          rawTermData,
        },
      }),
    };
  }

  try {
    return { type: 'parsed', parsed: JSON.parse(rawTermData) };
  } catch (err) {
    return {
      type: 'error',
      error: new ErrorWithFields({
        message: 'raw term data was not valid JSON data',
        source: err,
        fields: {
          rawTermData,
        },
      }),
    };
  }
}

type TermDataValidationResult =
  | { type: 'error'; errors: NonEmptyArray<Error>; fallback: TermData }
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

/**
 * Validates parsed term data, ensuring that it is of the expected shape
 */
function validateTermData(
  termData: unknown,
  rawTermData?: string
): TermDataValidationResult {
  try {
    if (
      termData == null ||
      typeof termData !== 'object' ||
      Array.isArray(termData)
    ) {
      return {
        type: 'error',
        fallback: defaultTermData,
        errors: [
          new ErrorWithFields({
            message: 'term data is the wrong type',
            fields: {
              rawTermData,
              termDataType: typeof termData,
              termData,
            },
          }),
        ],
      };
    }

    const validTermData = { ...defaultTermData };

    // Ensure each field is valid, copying them as we go
    const termDataAsRecord = termData as Record<string, unknown>;
    const fieldValidationErrors: Error[] = [];
    const {
      desiredCourses,
      pinnedCrns,
      excludedCrns,
      colorMap,
      sortingOptionIndex,
    } = termDataAsRecord;

    if (isStringArray(desiredCourses)) {
      validTermData.desiredCourses = desiredCourses;
    } else {
      fieldValidationErrors.push(
        new ErrorWithFields({
          message: 'termData.desiredCourses was not a string array',
          fields: {
            rawTermData,
            termData,
            desiredCourses,
            fallback: validTermData.desiredCourses,
          },
        })
      );
    }

    if (isStringArray(pinnedCrns)) {
      validTermData.pinnedCrns = pinnedCrns;
    } else {
      fieldValidationErrors.push(
        new ErrorWithFields({
          message: 'termData.pinnedCrns was not a string array',
          fields: {
            rawTermData,
            termData,
            pinnedCrns,
            fallback: validTermData.pinnedCrns,
          },
        })
      );
    }

    if (isStringArray(excludedCrns)) {
      validTermData.excludedCrns = excludedCrns;
    } else {
      fieldValidationErrors.push(
        new ErrorWithFields({
          message: 'termData.excludedCrns was not a string array',
          fields: {
            rawTermData,
            termData,
            excludedCrns,
            fallback: validTermData.excludedCrns,
          },
        })
      );
    }

    if (isStringStringMap(colorMap)) {
      validTermData.colorMap = colorMap;
    } else {
      fieldValidationErrors.push(
        new ErrorWithFields({
          message: 'termData.colorMap was not a string/string map',
          fields: {
            rawTermData,
            termData,
            colorMap,
            fallback: validTermData.colorMap,
          },
        })
      );
    }

    if (typeof sortingOptionIndex === 'number') {
      validTermData.sortingOptionIndex = sortingOptionIndex;
    } else {
      fieldValidationErrors.push(
        new ErrorWithFields({
          message: 'termData.sortingOptionIndex was not a number',
          fields: {
            rawTermData,
            termData,
            sortingOptionIndex,
            fallback: validTermData.sortingOptionIndex,
          },
        })
      );
    }

    if (fieldValidationErrors.length > 0) {
      return {
        type: 'error',
        fallback: validTermData,
        errors: fieldValidationErrors as NonEmptyArray<Error>,
      };
    }

    return { type: 'valid', termData: validTermData };
  } catch (err) {
    if (err instanceof Error) {
      return {
        type: 'error',
        fallback: defaultTermData,
        errors: [
          new ErrorWithFields({
            message: 'an unexpected error occurred when parsing term data',
            source: err,
            fields: {
              rawTermData,
            },
          }),
        ],
      };
    }

    return {
      type: 'error',
      fallback: defaultTermData,
      errors: [
        new ErrorWithFields({
          message: 'an unexpected error occurred when parsing term data',
          fields: {
            rawTermData,
            originalError: err,
          },
        }),
      ],
    };
  }
}
