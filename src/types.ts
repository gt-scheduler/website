import React from 'react';

export type Theme = 'light' | 'dark';

export function isTheme(theme: string): theme is Theme {
  switch (theme) {
    case 'light':
    case 'dark':
      return true;
    default:
      return false;
  }
}

export type LoadingState<T> =
  | LoadingStateLoaded<T>
  | LoadingStateLoading
  | LoadingStateError
  | LoadingStateCustom;
export type LoadingStateLoaded<T> = { type: 'loaded'; result: T };
export type LoadingStateLoading = { type: 'loading' };
export type LoadingStateError = {
  type: 'error';
  overview: React.ReactNode;
  error: Error;
  stillLoading: boolean;
};
export type LoadingStateCustom = {
  type: 'custom';
  contents: React.ReactNode;
};

export type NonEmptyArray<T> = [T, ...T[]];

// Declare (better) types for the ICS library
export type ICS = {
  download(filename: string, ext?: string): string | false;
  addEvent(
    subject: string,
    description: string,
    location: string,
    begin: string | Date,
    stop: string | Date,
    rrule: unknown
  ): false | string[];
};

export interface Combination {
  crns: string[];
  startMap: Record<string, number>;
  endMap: Record<string, number>;
}

export interface Period {
  start: number;
  end: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface Location {
  lat: number;
  long: number;
}

export interface Meeting {
  period: Period | undefined;
  days: string[];
  where: string;
  location: Location | null;
  instructors: string[];
  dateRange: DateRange;
  finalDate: Date | null;
  finalTime: Period | null;
}

export interface Event {
  id: string;
  name: string;
  period: Period;
  days: string[];
  showEditForm?: boolean;
}

export interface Term {
  term: string;
  finalized: boolean;
}

// Note: if this type ever changes,
// the course gpa cache needs to be invalidated
// (by changing the local storage key).
// See `src/data/beans/Course.ts` for the implementation of the cache.
export interface CourseGpa {
  averageGpa?: number;
  [instructor: string]: number | undefined;
}

// Meeting type (imported as `CrawlerMeeting`):
// Copied from https://github.com/gt-scheduler/crawler/blob/master/src/types.ts

export type CrawlerMeeting = [
  /**
   * an integer index into `caches.periods`,
   * specifying the class's start/end times
   */
  periodIndex: number,
  /**
   * a string specifying what days the class takes place on
   * (e.g. `"MW"` or `"TR"`)
   */
  days: string,
  /**
   * a string giving the room/location where the course will be held
   * (e.g. `"College of Business 224"`)
   */
  room: string,
  /**
   * an integer index into `caches.locations`,
   * containing the latitude and longitude for a given course
   */
  locationIndex: number,
  /**
   * an array of strings listing all the instructors for this section,
   * along with a 1-character code to mark the principal instructor
   * (e.g. `["Katarzyna Rubar (P)"]`)
   */
  instructors: string[],
  /**
   * an integer index into `caches.dateRanges`,
   * specifying the start/end date of the class this semester
   */
  dateRangeIndex: number,
  /**
   * integer index into caches.finalDates,
   * specifying the date at which the final is
   * -1 when no match could be found and
   * as a default value
   */
  finalDateIndex: number,
  /**
   * integer index into caches.finalTimes,
   * specifying the time at which the final is
   * -1 when no match could be found
   * and as a default value
   */
  finalTimeIdx: number
];

// Section type (imported as `CrawlerSection`):
// Copied from https://github.com/gt-scheduler/crawler/blob/master/src/types.ts

/**
 * Contains  information about the course's section
 * (**Note** that this is an **array** (tuple), not an object)
 */
export type CrawlerSection = [
  /**
   * the CRN number of this section of the course
   */
  crn: string,
  /**
   * array of information about the section's meeting
   * times/places/professors/etc.; in most cases, this array will only contain
   * 1 item
   */
  meetings: CrawlerMeeting[],
  /**
   * integer number of credit hours this course is worth
   */
  creditHours: number,
  /**
   * integer index into `caches.scheduleTypes`
   */
  scheduleTypeIndex: number,
  /**
   * integer index into `caches.campuses`,
   * specifying which campus the class is being taught at
   */
  campusIndex: number,
  /**
   * array of integer indices into `caches.attributes`,
   * specifying any additional attributes the course has
   */
  attributeIndices: number[],
  /**
   * integer index into caches.gradeBases,
   * specifying the grading scheme of the class
   */
  gradeBaseIndex: number
];

// Prerequisite types:
// Copied from https://github.com/gt-scheduler/crawler/blob/master/src/types.ts

export type MinimumGrade = 'A' | 'B' | 'C' | 'D' | 'T';
export type PrerequisiteCourse = { id: string; grade?: MinimumGrade };
export type PrerequisiteClause = PrerequisiteCourse | PrerequisiteSet;
export type PrerequisiteOperator = 'and' | 'or';
export type PrerequisiteSet = [
  operator: PrerequisiteOperator,
  ...clauses: PrerequisiteClause[]
];

/**
 * Recursive data structure that is the sequence of all prerequisites in prefix
 * notation, parsed from the information on Oscar
 *
 * @example
 *
 * ```json
   [
     "and",
     [
       "or",
       {"id":"CS 3510", "grade":"C"},
       {"id":"CS 3511", "grade":"C"}
     ]
   ]
 * ```
 */
export type CrawlerPrerequisites = PrerequisiteSet | [];

// Caches type (imported as `CrawlerCaches`):
// Copied from https://github.com/gt-scheduler/crawler/blob/master/src/types.ts

/**
 * Contains data shared by multiple class descriptions
 */
export interface CrawlerCaches {
  /**
   * List of all the different time ranges that classes can be offered at
   * (e.g. `"8:00 am - 8:50 am"`;
   * there is one `"TBA"` string for classes whose time is "To Be Announced")
   */
  periods: string[];
  /**
   * List of all possible start/ending dates that classes can be offered between
   * (e.g. `"Aug 17, 2020 - Dec 10, 2020"`)
   */
  dateRanges: string[];
  /**
   * List of the different types of classes for each time block
   * (e.g. `"Lecture*"`, `"Recitation*"`, or `"Internship/Practicum*"`)
   */
  scheduleTypes: string[];
  /**
   * List of the different GT campus locations that a class could take place at
   * (e.g. `"Georgia Tech-Atlanta *"` or `"Online"`)
   */
  campuses: string[];
  /**
   * List of other miscellaneous attributes that can be associated with a class
   * (e.g. `"Hybrid Course"`, `"Honors Program"`, or `"Capstone"`)
   */
  attributes: string[];
  /**
   * List of the different kinds of grading schemes a course can have
   */
  gradeBases: string[];
  /**
   * List of the different building locations a class can be at
   */
  locations: Location[];

  /**
   * List of the all the dates on which finals are happening
   * Example date: Aug 02, 2022
   */
  finalDates: Date[];

  /**
   * List of the time blocks for finals
   * Example time: 11:20 am - 2:10 pm
   */
  finalTimes: string[];
  /**
   * List of the full names of courses
   * Example name: Accounting for ACCT
   * */
  fullCourseNames: { [key: string]: string };
}

// Course type (imported as `CrawlerCourse`):
// Copied from https://github.com/gt-scheduler/crawler/blob/master/src/types.ts

/**
 * Contains information about a single class
 * (**Note** that this is an **array** (tuple), not an object)
 */
export type CrawlerCourse = [
  /**
   * the full, human-readable name of the course (e.g. "Accounting I")
   */
  fullName: string,
  /**
   * a JSON object with information about each section of the course;
   * the section IDs are the keys (`"A"`, `"B"`, `"S2"`, etc.)
   */
  sections: Record<string, CrawlerSection>,
  /**
     * a tree of prerequisite classes and the necessary grades in them
     * (using boolean expressions in prefix order)
     *
     * @example
     *
     * ```json
       [
         "and",
         [
            "or",
            {"id":"CS 3510", "grade":"C"},
            {"id":"CS 3511", "grade":"C"}
         ]
       ]
     * ```
     */
  // ! Type had `undefined` explicitly added to ensure we check when accessing
  prerequisites: CrawlerPrerequisites | undefined,
  /**
   * Description pulled from Oscar
   */
  description: string | null
];

// TermData type (imported as `CrawlerTermData`):
// Copied from https://github.com/gt-scheduler/crawler/blob/master/src/types.ts

/**
 * Primary JSON object returned by the API.
 * See https://github.com/GTBitsOfGood/gt-scheduler/issues/1#issuecomment-694326220
 * for more info on the shape
 */
export interface CrawlerTermData {
  /**
   * Contains information about each class;
   * this makes up the vast bulk of the resultant JSON.
   * The course IDs are the keys (`"ACCT 2101"`, `"CS 2340"`, etc.)
   */
  courses: Record<string, CrawlerCourse>;
  /**
   * Contains data shared by multiple class descriptions
   */
  caches: CrawlerCaches;
  /**
   * Contains the time this JSON file was retrieved
   */
  // ! Type changed to `string` since this is what the JSON will be
  updatedAt: string;
  /**
   * Version number for the term data
   */
  version: number;
}

export type ScheduleDeletionRequest = {
  /**
   * token of account that requested the schedule deletion
   */
  IDToken: string | void;
  /**
   * ID of the INVITEE if the deletion requester is the INVITER
   * ID of the INVITER if the deletion requester is the INVITEE
   */
  peerUserId: string;
  /**
   * term that schedule version(s) belong to
   */
  term: string;
  /**
   * shared schedule version(s) for deletion
   */
  versions: string[] | string;
  /**
   * whether the schedule version belongs to the requester
   */
  owner: boolean;
};
