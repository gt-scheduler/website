// These should always be the latest version of schedule data
export const LATEST_SCHEDULE_DATA_VERSION: ScheduleData['version'] = 1;
export type ScheduleData = Version1ScheduleData;
export type TermScheduleData = Version1TermScheduleData;
export type Schedule = Version1Schedule;

// Add additional types here named like "___OrNewer" for each version,
// where they are an alias for the version | Version+1ScheduleDataOrNewer.
// For example, once version 2 is added, there would be two types:
// type Version2ScheduleDataOrNewer = Version2ScheduleData;
// type Version1ScheduleDataOrNewer =
//   Version2ScheduleDataOrNewer | Version1ScheduleData;
export type Version1ScheduleDataOrNewer = Version1ScheduleData;

// This type should automatically accept any schedule data
export type AnyScheduleData = Version1ScheduleDataOrNewer;

// Version 1 schedule data (2021-09-10)
// ===================================
//  - addition of schedule versions
//  - migration from multiple cookies to single local storage key

export interface Version1ScheduleData {
  terms: Record<string, Version1TermScheduleData>;
  currentTerm: string;
  version: 1;
}

export interface Version1TermScheduleData {
  versions: Record<string, Version1Schedule>;
  currentVersion: string;
}

export interface Version1Schedule {
  desiredCourses: string[];
  pinnedCrns: string[];
  excludedCrns: string[];
  colorMap: Record<string, string>;
  sortingOptionIndex: number;
}
