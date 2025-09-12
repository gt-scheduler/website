import React from 'react';
import { IBackOffOptions } from 'exponential-backoff';
import { DelayFactory } from 'exponential-backoff/dist/delay/delay.factory';
import { getSanitizedOptions } from 'exponential-backoff/dist/options';
import domtoimage from 'dom-to-image';
import { saveAs } from 'file-saver';
import { Immutable } from 'immer';

import { Oscar, Section } from '../data/beans';
import { DAYS, PALETTE, PNG_SCALE_FACTOR } from '../constants';
import { ErrorWithFields, softError } from '../log';
import {
  DateRange,
  Event,
  ICS,
  Meeting,
  Period,
  PrerequisiteClause,
  Theme,
} from '../types';
import ics from '../vendor/ics';
import { getSemesterName } from './semesters';

/* Converts a string of the form "930" to 750. strings of the
  mentioned format are returned by crawler v2 */
export const stringToTime = (string: string): number => {
  if (
    string === 'null' ||
    string.length < 3 ||
    string.length > 4 ||
    Number.isNaN(parseInt(string, 10))
  ) {
    return 0;
  }

  const [hour, minute] = [
    string.substring(0, string.length - 2),
    string.substring(string.length - 2, string.length),
  ];
  return parseInt(hour, 10) * 60 + parseInt(minute, 10);
};

export const timeToString = (
  time: number,
  ampm = true,
  leadingZero = false
): string => {
  const hour = (time / 60) | 0;
  const minute = time % 60;
  const h = hour > 12 ? hour - 12 : hour;
  const hh = leadingZero ? `${hour}`.padStart(2, '0') : h;
  const mm = `${minute}`.padStart(2, '0');
  const A = `${hour < 12 ? 'a' : 'p'}m`;
  return ampm ? `${hh}:${mm} ${A}` : `${hh}:${mm}`;
};

export const timeToShortString = (time: number): string => {
  const hour = (time / 60) | 0;
  return `${hour > 12 ? hour - 12 : hour}${hour < 12 ? 'a' : 'p'}m`;
};

export const periodToString = (period: Period | undefined): string =>
  period != null
    ? `${timeToString(period.start, false)} - ${timeToString(period.end)}`
    : 'TBA';

export const daysToString = (days: readonly string[] | string[]): string => {
  const set = new Set(days);
  return DAYS.filter((day) => set.has(day)).join('');
};

export const getRandomColor = (): string => {
  const colors = PALETTE.flat();
  const index = (Math.random() * colors.length) | 0;
  return colors[index] ?? '#333333';
};

export const getContentClassName = (color: string | undefined): string => {
  if (color == null) return 'light-content';
  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 128
    ? 'light-content'
    : 'dark-content';
};

export const hasConflictBetweenMeetings = (
  meeting1: Meeting | Immutable<Event>,
  meeting2: Meeting | Immutable<Event>
): boolean | undefined =>
  meeting1.period &&
  meeting2.period &&
  DAYS.some(
    (day) => meeting1.days.includes(day) && meeting2.days.includes(day)
  ) &&
  meeting1.period.start < meeting2.period.end &&
  meeting2.period.start < meeting1.period.end;

export const hasConflictBetween = (
  section1: Section,
  section2: Section
): boolean =>
  section1.meetings.some((meeting1) =>
    section2.meetings.some((meeting2) =>
      hasConflictBetweenMeetings(meeting1, meeting2)
    )
  );

export const hasConflictBetweenSectionAndEvent = (
  section: Section,
  event: Immutable<Event>
): boolean =>
  section.meetings.some((meeting) =>
    hasConflictBetweenMeetings(meeting, event)
  );

export const classes = (
  ...classList: (string | boolean | null | undefined)[]
): string => classList.filter((c) => c).join(' ');

export const isMobile = (): boolean => window.innerWidth < 1024;

export const simplifyName = (name: string, delimiter?: string): string => {
  const tokens = name.split(' ');
  const firstName = tokens.shift();
  const lastName = tokens.pop();
  return [firstName, lastName].join(delimiter ?? ' ');
};

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export const isLab = (section: Section): boolean =>
  ['Lab', 'Studio'].some((type) => section.scheduleType.includes(type));

export const isLecture = (section: Section): boolean =>
  section.scheduleType.includes('Lecture');

export function humanizeArray<T>(array: T[], conjunction = 'and'): string {
  if (array.length <= 2) {
    return array.join(` ${conjunction} `);
  }
  const init = [...array];
  const last = init.pop();
  return `${init.join(', ')}, ${conjunction} ${String(last)}`;
}

export function humanizeArrayReact<T>(
  array: T[],
  conjunction: React.ReactNode = 'and'
): React.ReactNode {
  if (array.length === 0) {
    return null;
  }
  if (array.length === 1) {
    return String(array[0]);
  }
  if (array.length === 2) {
    return (
      <>
        {String(array[0])} {conjunction} {String(array[1])}
      </>
    );
  }

  const init = [...array];
  const last = init.pop();
  return (
    <>
      {`${init.join(', ')},`.trim()} {conjunction} {String(last)}
    </>
  );
}

export const serializePrereqs = (
  reqs: PrerequisiteClause,
  openPar = false,
  closePar = false
): string => {
  // This function accepts the index of a sub-clause
  // from the sub-clause slice of a compound prereq clause
  // (i.e. the [...sub-clauses] part of a clause
  // that itself is of the form [operator, ...sub-clauses]).
  // As such, we compare to the clause length - 2
  // (since the sub-clauses[0] is really reqs[1])
  const last = (i: number): boolean =>
    Array.isArray(reqs) && i === reqs.length - 2;
  let string = '';

  if (!Array.isArray(reqs)) {
    string += (openPar ? '(' : '') + reqs.id + (closePar ? ')' : '');
  } else if (reqs[0] === 'and') {
    const [, ...subClauses] = reqs;
    subClauses.forEach((req, i) => {
      string +=
        serializePrereqs(req, i === 0, last(i)) + (last(i) ? '' : ' and ');
    });
  } else if (reqs[0] === 'or') {
    const [, ...subClauses] = reqs;
    subClauses.forEach((req, i) => {
      string += serializePrereqs(req) + (last(i) ? '' : ' or ');
    });
  }

  return string;
};

// Determines whether an error is an axios network error,
// which is used when determining whether to send it to Sentry
// (since we can't do anything about a client-side NetworkError)--
// it's either an error in the user's network
// or downtime in a third-party service.
export const isAxiosNetworkError = (err: unknown): boolean => {
  return err instanceof Error && err.message.includes('Network Error');
};

/**
 * Sleeps for a delay controlled by an exponential backoff function with jitter.
 * Acts as a thin wrapper around `exponential-backoff`
 * that provides a lower-level API
 * @param attemptNumber - The number of attempts that have occurred so far
 * @param options - [optional] config for exponential-backoff
 */
export async function exponentialBackoff(
  attemptNumber: number,
  options: Partial<IBackOffOptions> = {}
): Promise<void> {
  await DelayFactory(
    getSanitizedOptions({
      // See https://github.com/coveooss/exponential-backoff for options API
      jitter: 'full',
      numOfAttempts: Number.MAX_SAFE_INTEGER,
      ...options,
    }),
    attemptNumber
  ).apply();
}

/**
 * Promise version of `setTimeout`; used to wait for a specific delay
 */
export async function sleep({
  amount_ms,
}: {
  amount_ms: number;
}): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(() => resolve(undefined), amount_ms);
  });
}

// Object that stores the estimated date range for a semester.
// Used to estimate the date range of recurring events.
const termDates: Record<string, { from: string; to: string }> = {
  Spring: {
    from: '05 Jan',
    to: '10 May',
  },
  Summer: {
    from: '15 May',
    to: '15 Aug',
  },
  Fall: {
    from: '15 Aug',
    to: '15 Dec',
  },
};

const getDateRange = (term: string): DateRange => {
  const [sem, year] = getSemesterName(term).split(' ');
  const defaultRange = { from: new Date(), to: new Date() };
  if (!sem || !year) return defaultRange;
  const range = termDates[sem];
  if (!range) return defaultRange;
  const from = new Date(`${range.from} ${year}`);
  const to = new Date(`${range.to} ${year}`);
  return { from, to };
};

export const getFullYear = (): number => {
  return new Date().getFullYear();
};

/**
 * Exports the current schedule to a `.ics` file,
 * which allows for importing into a third-party calendar application.
 */
export function exportCoursesToCalendar(
  oscar: Oscar,
  pinnedCrns: readonly string[],
  events: Immutable<Event[]>,
  term: string
): void {
  const cal = ics('gt-scheduler') as ICS | undefined;

  if (cal == null) {
    window.alert('This browser does not support calendar export');
    softError(
      new ErrorWithFields({
        message: 'ics() returned null or undefined',
      })
    );

    return;
  }

  const addEventsToCalendar = (
    period: Period,
    days: string[],
    dateRange: DateRange,
    subject: string,
    description = '',
    location = ''
  ): void => {
    const { from, to } = dateRange;
    const begin = new Date(from.getTime());
    while (
      !days.includes(['-', 'M', 'T', 'W', 'R', 'F', '-'][begin.getDay()] ?? '-')
    ) {
      begin.setDate(begin.getDate() + 1);
    }
    const startTime = period.start;
    const endTime = period.end;
    begin.setHours(startTime / 60, startTime % 60);
    const end = new Date(begin.getTime());
    end.setHours(endTime / 60, endTime % 60);
    const rrule = {
      freq: 'WEEKLY',
      until: to,
      byday: days
        .map(
          (day) =>
            ({ M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR' }[day] ?? null)
        )
        .filter((day) => !!day),
    };
    cal.addEvent(subject, description, location, begin, end, rrule);
  };

  pinnedCrns.forEach((crn) => {
    const section = oscar.findSection(crn);
    if (section == null) return;

    section.meetings.forEach((meeting) => {
      if (!meeting.period || !meeting.days.length) return;
      const subject = section.course.id;
      const description = section.course.title;
      const location = meeting.where;
      addEventsToCalendar(
        meeting.period,
        meeting.days,
        meeting.dateRange,
        subject,
        description,
        location
      );
    });
  });

  const range = getDateRange(term);
  events.forEach((event) => {
    addEventsToCalendar(
      { ...event.period },
      [...event.days],
      range,
      event.name
    );
  });
  cal.download('gt-scheduler');
}

/**
 * Downloads a screenshot of the "shadow" calendar
 * that exists invisible in the app
 * and reflects the current state of the scheduler.
 * Allows the screenshot to be exported consistently
 * regardless of screen size or app state.
 * Requires the theme to style the background before taking the screenshot.
 */
export function downloadShadowCalendar(
  captureElement: HTMLDivElement,
  theme: Theme
): void {
  const computed = window
    .getComputedStyle(captureElement)
    .getPropertyValue('left');

  domtoimage
    .toBlob(captureElement, {
      width: captureElement.offsetWidth * PNG_SCALE_FACTOR,
      height: captureElement.offsetHeight * PNG_SCALE_FACTOR,
      style: {
        transform: `scale(${PNG_SCALE_FACTOR})`,
        'transform-origin': `${computed} 0px`,
        'background-color': theme === 'light' ? '#FFFFFF' : '#333333',
      },
    })
    .then((blob) => saveAs(blob, 'schedule.png'))
    .catch((err) =>
      softError(
        new ErrorWithFields({
          message:
            'could not take screenshot of shadow calendar for schedule export',
          source: err,
        })
      )
    );
}

export const PRIMARY_VERSION_NAME = 'Primary';
const OTHER_VERSIONS_NAMES = [
  'Secondary',
  'Tertiary',
  'Quaternary',
  'Quinary',
  'Senary',
  'Septenary',
  'Octonary',
  'Nonary',
  'Denary',
];

/**
 * Gets the next auto-generated version name in the sequence of
 * Primary, Secondary, Tertiary, ...
 * all the way up to the name for the 10th item (Denary)
 * before returning "New version".
 * If the array is empty, then it always returns 'Primary'.
 * Otherwise, it will return the first item in the sequence,
 * starting with 'Secondary' (meaning that it will always skip 'Primary',
 * even if it's not an element in the given list)
 */
export function getNextVersionName(allVersionNames: readonly string[]): string {
  const allNamesSet: Set<string> = new Set(allVersionNames);
  if (allNamesSet.size === 0) return PRIMARY_VERSION_NAME;

  for (const version of OTHER_VERSIONS_NAMES) {
    if (!allNamesSet.has(version)) {
      return version;
    }
  }

  // Fall back to the default with over 10 versions
  return 'New version';
}

/**
 * Generates a random alpha-numeric string of the given length.
 * Contains the characters A-Z, a-z, and 0-9.
 */
export function generateRandomId(length: number): string {
  const charPool =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charPool[Math.floor(Math.random() * charPool.length)];
  }
  return result;
}

/**
 * Lexicographically compares two strings (usable as a comparator function).
 * Based on:
 * https://riptutorial.com/javascript/example/5388/comparing-strings-lexicographically
 */
export function lexicographicCompare(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  if (a > b) {
    return 1;
  }

  return -1;
}

// Edit this map to control how locations are abbreviated.
// Prefer adding new entries to this map over changing the location strings,
// since old schedules can still be opened in the app.
//
// When adding new entries, consider also updating the crawler's coordinate
// mapping in https://github.com/gt-scheduler/crawler/blob/main/src/steps/parse.ts
// (search for `courseLocations`).
//
// Initial locations were loosely based on:
// https://github.com/gt-scheduler/crawler/blob/main/src/steps/parse.ts
const LOCATION_ABBREVIATIONS: Record<string, string> = {
  '760 Spring St NW': '760 Spring St',
  '760 Spring Street': '760 Spring St',
  'Clough Commons': 'CULC',
  'Clough UG Learning Commons': 'CULC',
  'Coll of Computing': 'CCB',
  'College of Computing': 'CCB',
  'D. M. Smith': 'DM Smith',
  'D.M. Smith': 'DM Smith',
  'Engr Science & Mech': 'ESM',
  'Engineering Sci and Mechanics': 'ESM',
  'Ford Environmental Sci & Tech': 'ES&T',
  'Ford Environmental Sci &amp; Tech': 'ES&T',
  'Howey (Physics)': 'Howey',
  'Howey Physics': 'Howey',
  'Instr Center': 'IC',
  'Instructional Center': 'IC',
  'J. Erskine Love Manufacturing': 'Love (MRDC II)',
  'Klaus Advanced Computing': 'Klaus',
  'Manufacture Rel Discip Complex': 'MRDC',
  'Molecular Sciences & Engr': 'MoSE',
  'Molecular Sciences & Engineering': 'MoSE',
  'Paper Tricentennial': 'Paper',
  'Scheller College of Business': 'Scheller',
  'Sustainable Education': 'SEB',
  'U A Whitaker Biomedical Engr': 'Whitaker',
  'West Village Dining Commons': 'West Village',
  'Guggenheim Aerospace': 'Guggenheim',
};

export function abbreviateLocation(location: string): string {
  for (const [full, abbrev] of Object.entries(LOCATION_ABBREVIATIONS)) {
    if (location.startsWith(full)) {
      const withoutFull = location.substring(full.length).trim();
      return `${abbrev} ${withoutFull}`;
    }
  }

  return location;
}
