import Cookies from 'js-cookie';

import { softError, ErrorWithFields } from '../../log';
import {
  AnyScheduleData,
  ScheduleData,
  Version1ScheduleDataOrNewer,
} from '../types';
import migrateCookiesTo1, { defaultVersion1ScheduleData } from './cookiesTo1';

/**
 * Attempts to migrate the given "raw" schedule data
 * (which can be of any version) to the latest version,
 * automatically applying pre-defined migrations between versions.
 * If this function fails, it will throw an error; otherwise,
 * it returns an instance of the schedule data for the latest version
 */
export default function migrateScheduleData(
  rawScheduleData: AnyScheduleData | null
): ScheduleData {
  // Having the `scheduleData` be `null`counts as a "special" migration
  // from the legacy storage method (if it exists).
  let scheduleDataVersion1OrNewer: Version1ScheduleDataOrNewer;
  if (rawScheduleData === null) {
    try {
      const allCookies = Cookies.get();
      scheduleDataVersion1OrNewer = migrateCookiesTo1(allCookies);
    } catch (err) {
      // An error occurred: fall back to the default data & report it
      softError(
        new ErrorWithFields({
          source: err,
          message: 'an error occurred when sourcing schedule data from cookies',
        })
      );
      scheduleDataVersion1OrNewer = defaultVersion1ScheduleData;
    }
  } else {
    scheduleDataVersion1OrNewer = rawScheduleData;
  }

  // Apply any other migrations here if the version of the data
  // is lesser than the current one. For example:
  // let scheduleDataVersion2OrNewer: Version2ScheduleDataOrNewer;
  // if (scheduleDataVersion1OrNewer.version === 1) {
  //   scheduleDataVersion2OrNewer =
  //     migrateVersion1To2(scheduleDataVersion1OrNewer);
  //   // scheduleDataVersion2OrNewer.version is now 2
  // } else {
  //   scheduleDataVersion2OrNewer = scheduleDataVersion1OrNewer;
  // }
  // Note: if a migration fails, we probably can't continue,
  // so feel free to throw an error that will be caught by the caller.

  return scheduleDataVersion1OrNewer;
}
