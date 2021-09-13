import { parseTermData, validateTermData } from '../legacy/validation';
import { softError, ErrorWithFields } from '../../log';
import { isTerm } from '../../utils/semesters';
import { Version1ScheduleData, Version1TermScheduleData } from '../types';

export const defaultVersion1ScheduleData: Version1ScheduleData = {
  terms: {},
  currentTerm: '',
  version: 1,
};

/**
 * Attempts to "migrate" the existing data from the legacy cookie format
 * to version 1 of the schedule data. The output of this function should be
 * safe to migrate to further versions, if applicable. If allCookies
 * is an empty record, then this function returns the default v1 schedule data.
 * @param allCookies - the result of `Cookies.get()` with no arguments --
 * a record of all cookie keys -> values
 */
export default function migrateCookiesTo1(
  allCookies: Record<string, string>
): Version1ScheduleData {
  const currentTerm = allCookies['term'] ?? '';

  // Create a number to correlate error events
  const userNumber = Math.floor(Math.random() * 100000);

  // Collect the values of all cookies that look like term schedule data:
  const terms: Record<string, Version1TermScheduleData> = {};
  Object.entries(allCookies).forEach(([cookieKey, cookieValue]): void => {
    if (isTerm(cookieKey)) {
      // Try to parse and validate the term information
      const parseResult = parseTermData(cookieValue);
      if (parseResult.type === 'error') {
        softError(
          new ErrorWithFields({
            message: 'parsing error for guessed term data when migrating',
            source: parseResult.error,
            fields: {
              cookieKey,
              cookieValue,
              userNumber,
            },
          })
        );
        return;
      }

      const validateResult = validateTermData(parseResult.parsed, cookieValue);
      if (validateResult.type === 'error') {
        validateResult.errors.forEach((err) => {
          softError(
            new ErrorWithFields({
              message: 'validation error for guessed term data when migrating',
              source: err,
              fields: {
                cookieKey,
                cookieValue,
                userNumber,
              },
            })
          );
        });

        terms[cookieKey] = {
          versions: [{ name: 'Primary', schedule: validateResult.fallback }],
          currentIndex: 0,
        };
      } else {
        terms[cookieKey] = {
          versions: [{ name: 'Primary', schedule: validateResult.termData }],
          currentIndex: 0,
        };
      }
    }
  });

  return {
    terms,
    currentTerm,
    version: 1,
  };
}
