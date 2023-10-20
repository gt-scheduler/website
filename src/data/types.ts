import { castImmutable, Immutable } from 'immer';

import { Event } from '../types';
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
export const LATEST_SCHEDULE_DATA_VERSION: ScheduleData['version'] = 3;
export type ScheduleData = Version3ScheduleData;
export type TermScheduleData = Version3TermScheduleData;
export type ScheduleVersion = Version3ScheduleVersion;
export type Schedule = Version3Schedule;

// Add additional types here named like "Version{N}OrNewer" for each version,
// where they are an alias for:
// Version{N}ScheduleData | Version{N+1}ScheduleDataOrNewer.
export type Version1ScheduleDataOrNewer =
  | Version2ScheduleDataOrNewer
  | Version1ScheduleData;
export type Version2ScheduleDataOrNewer =
  | Version3ScheduleDataOrNewer
  | Version2ScheduleData;
export type Version3ScheduleDataOrNewer = Version3ScheduleData;

// This type should automatically accept any schedule data
export type AnyScheduleData = Version1ScheduleDataOrNewer;

export const defaultScheduleData: Immutable<ScheduleData> = {
  terms: {},
  version: 3,
};

export const defaultFriendData: Immutable<FriendData> = {
  terms: {},
  info: {},
};

export const defaultFriendInfo: Immutable<{
  name: string;
  email: string;
}> = castImmutable({
  name: '',
  email: '',
});

export const defaultFriendTermData: Immutable<FriendTermData> = {
  accessibleSchedules: {},
};

export const defaultFriendScheduleData: Immutable<FriendScheduleData> = {
  //
};

export const defaultTermScheduleData: Immutable<TermScheduleData> = {
  versions: {},
};

export const defaultSchedule: Immutable<Schedule> = {
  desiredCourses: [],
  pinnedCrns: [],
  excludedCrns: [],
  events: [],
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

// Version 3 schedule data (2023-01-22)
// ===================================
// - addition of custom events

export interface Version3ScheduleData {
  terms: Record<string, Version3TermScheduleData>;
  version: 3;
}

export interface Version3TermScheduleData {
  versions: Record<string, Version3ScheduleVersion>;
}

export interface Version3ScheduleVersion {
  name: string;
  friends: Record<string, FriendShareData>;
  createdAt: string;
  schedule: Version3Schedule;
}

export interface FriendShareData {
  status: 'Pending' | 'Accepted';
  email: string;
}

export interface Version3Schedule {
  desiredCourses: string[];
  pinnedCrns: string[];
  excludedCrns: string[];
  events: Event[];
  colorMap: Record<string, string>;
  sortingOptionIndex: number;
}

export type FriendIds = Record<string, string[]>;

export interface FriendTermData {
  accessibleSchedules: FriendIds;
}

export type ApiErrorResponse = {
  message: string;
};

export type FriendInfo = Record<
  string,
  {
    name: string;
    email: string;
  }
>;

export interface FriendData {
  terms: Record<string, FriendTermData>;
  info: FriendInfo;
}

export type RawFriendScheduleData = Record<
  string,
  {
    versions: Record<
      string,
      {
        name: string;
        schedule: Schedule;
      }
    >;
  }
>;

export type FriendScheduleData = Record<
  string,
  {
    name: string;
    email: string;
    versions: Record<
      string,
      {
        name: string;
        schedule: Schedule;
      }
    >;
  }
>;
