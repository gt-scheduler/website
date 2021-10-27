import { Immutable } from 'immer';

import { generateRandomId } from '../utils/misc';

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
export const LATEST_SCHEDULE_DATA_VERSION: ScheduleData['version'] = 2;
export type ScheduleData = Version2ScheduleData;
export type TermScheduleData = Version2TermScheduleData;
export type ScheduleVersion = Version2ScheduleVersion;
export type Schedule = Version2Schedule;

// Add additional types here named like "Version{N}OrNewer" for each version,
// where they are an alias for:
// Version{N}ScheduleData | Version{N+1}ScheduleDataOrNewer.
export type Version1ScheduleDataOrNewer =
  | Version2ScheduleDataOrNewer
  | Version1ScheduleData;
export type Version2ScheduleDataOrNewer = Version2ScheduleData;

// This type should automatically accept any schedule data
export type AnyScheduleData = Version1ScheduleDataOrNewer;

export const defaultScheduleData: Immutable<ScheduleData> = {
  terms: {},
  version: 2,
};

export const defaultTermScheduleData: Immutable<TermScheduleData> = {
  versions: {},
};

export const defaultSchedule: Immutable<Schedule> = {
  desiredCourses: [],
  pinnedCrns: [],
  excludedCrns: [],
  colorMap: {},
  sortingOptionIndex: 0,
};

export const generateScheduleVersionId = (): string =>
  `sv_${generateRandomId(20)}`;

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

// Version 2 schedule data (2021-10-26)
// ===================================
//  - addition of unique keys for schedule versions
//  - addition of createdAt fields for schedule versions
//    to provide natural, reconcilable, sort order
//  - removal of all `currentIndex` and `currentTerm` fields
//    (instead stored in separate ui state)

export interface Version2ScheduleData {
  terms: Record<string, Version2TermScheduleData>;
  version: 2;
}

export interface Version2TermScheduleData {
  versions: Record<string, Version2ScheduleVersion>;
}

export interface Version2ScheduleVersion {
  name: string;
  createdAt: string;
  schedule: Version2Schedule;
}

export interface Version2Schedule {
  desiredCourses: string[];
  pinnedCrns: string[];
  excludedCrns: string[];
  colorMap: Record<string, string>;
  sortingOptionIndex: number;
}
