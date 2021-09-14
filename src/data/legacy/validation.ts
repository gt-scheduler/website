import { ErrorWithFields } from '../../log';
import { NonEmptyArray } from '../../types';
import { TermData, defaultTermData } from './types';

export type TermDataParseResult =
  | { type: 'error'; error: Error }
  | { type: 'parsed'; parsed: unknown };

/**
 * Parses raw term data from its string representation to the parsed JSON
 */
export function parseTermData(rawTermData: string): TermDataParseResult {
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

export type TermDataValidationResult =
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
export function validateTermData(
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
