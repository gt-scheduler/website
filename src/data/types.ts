import { Immutable } from 'immer';

// This file defines all of the possible types that the schedule data can take
// (in addition to a few helpers/constants).
// When adding new schedule data versions (schemas),
// make sure not to delete any of the existing types;
// they are needed in order to correctly type the migration functions.
// Including all of the old version schemas and including migration functions
// ensures that we gracefully handle users opening the app
// with whatever local state they have (even if it's old),
// and the app not losing/corrupting their state.

// These should always be the latest version of schedule data
export const LATEST_SCHEDULE_DATA_VERSION: ScheduleData['version'] = 1;
export type ScheduleData = Version1ScheduleData;
export type TermScheduleData = Version1TermScheduleData;
export type ScheduleVersion = Version1ScheduleVersion;
export type Schedule = Version1Schedule;

// Add additional types here named like "Version{N}OrNewer" for each version,
// where they are an alias for:
// Version{N}ScheduleData | Version{N+1}ScheduleDataOrNewer.
// For example, once version 2 is added, there would be two types:
// type Version1ScheduleDataOrNewer =
//   | Version2ScheduleDataOrNewer
//   | Version1ScheduleData;
// type Version2ScheduleDataOrNewer = Version2ScheduleData;
export type Version1ScheduleDataOrNewer = Version1ScheduleData;

// This type should automatically accept any schedule data
export type AnyScheduleData = Version1ScheduleDataOrNewer;

export const defaultScheduleData: Immutable<ScheduleData> = {
  terms: {},
  currentTerm: '',
  version: 1,
};

export const defaultTermScheduleData: Immutable<TermScheduleData> = {
  versions: [],
  currentIndex: 0,
};

export const defaultSchedule: Immutable<Schedule> = {
  desiredCourses: [],
  pinnedCrns: [],
  excludedCrns: [],
  colorMap: {},
  sortingOptionIndex: 0,
};

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
  versions: Version1ScheduleVersion[];
  currentIndex: number;
}

export interface Version1ScheduleVersion {
  name: string;
  schedule: Version1Schedule;
}

export interface Version1Schedule {
  desiredCourses: string[];
  pinnedCrns: string[];
  excludedCrns: string[];
  colorMap: Record<string, string>;
  sortingOptionIndex: number;
}
