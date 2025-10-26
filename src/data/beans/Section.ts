import axios from 'axios';
import cheerio from 'cheerio';
import { decode } from 'html-entities';

import { unique } from '../../utils/misc';
import { DELIVERY_MODES, BACKEND_BASE_URL } from '../../constants';
import Course from './Course';
import Oscar from './Oscar';
import { CrawlerMeeting, Meeting } from '../../types';
import { ErrorWithFields, softError } from '../../log';

export type Seating = [
  seating:
    | [] // Loading state
    | [
        // Loaded state
        seatsCurrent: number,
        seatsTotal: number,
        waitlistCurrent: number,
        waitlistTotal: number
      ]
    | string[], // Error state
  fetchTime: number
];

type SectionConstructionData = [
  crn: string,
  meetings: CrawlerMeeting[],
  credits: number,
  scheduleTypeIndex: number,
  campusIndex: number,
  attributeIndices: number[],
  gradeBasisIndex: number
];

export default class Section {
  course: Course;

  id: string;

  crn: string;

  seating: Seating;

  credits: number;

  scheduleType: string;

  campus: string;

  deliveryMode: string | undefined;

  gradeBasis: string;

  meetings: Meeting[];

  instructors: string[];

  // This field is initialized after construction inside `Course.constructor`
  associatedLabs: Section[];

  // This field is initialized after construction inside `Course.constructor`
  associatedLectures: Section[];

  term: string;

  constructor(
    oscar: Oscar,
    course: Course,
    sectionId: string,
    data: SectionConstructionData
  ) {
    this.term = oscar.term;
    const [
      crn,
      meetings,
      credits,
      scheduleTypeIndex,
      campusIndex,
      attributeIndices,
      gradeBasisIndex,
    ] = data;

    this.course = course;
    this.id = sectionId;
    this.crn = crn;
    this.seating = [[], 0];
    this.credits = credits;
    this.scheduleType = oscar.scheduleTypes[scheduleTypeIndex] ?? 'unknown';
    this.campus = oscar.campuses[campusIndex] ?? 'unknown';
    const attributes = attributeIndices
      .map((attributeIndex) => oscar.attributes[attributeIndex])
      .flatMap((attribute) => (attribute == null ? [] : [attribute]));
    this.deliveryMode = attributes.find(
      (attribute) => attribute in DELIVERY_MODES
    );

    this.gradeBasis = oscar.gradeBases[gradeBasisIndex] ?? 'unknown';
    this.meetings = meetings.map<Meeting>(
      ([
        periodIndex,
        days,
        where,
        locationIndex,
        instructors,
        dateRangeIndex,
        // These fields will be undefined if oscar.version < 3
        finalDateIndex,
        finalTimeIndex,
      ]) => ({
        period: oscar.periods[periodIndex],
        days: days === '&nbsp;' ? [] : days.split(''),
        where: decode(where),
        location: oscar.locations[locationIndex] ?? null,
        // place instructors with (P) first and trim all elements
        instructors: instructors
          .sort((a, b) => {
            const aHasP = a.endsWith(' (P)');
            const bHasP = b.endsWith(' (P)');
            if (aHasP && !bHasP) return -1;
            if (!aHasP && bHasP) return 1;
            return 0;
          })
          .map((instructor) => instructor.replace(/ \(P\)$/, '').trim()),
        // We need some fallback here
        dateRange: oscar.dateRanges[dateRangeIndex] ?? {
          from: new Date(),
          to: new Date(),
        },
        finalDate:
          finalDateIndex === -1 || oscar.version < 3
            ? null
            : oscar.finalDates[finalDateIndex] ?? null,
        finalTime:
          finalTimeIndex === -1 || oscar.version < 3
            ? null
            : oscar.finalTimes[finalTimeIndex] ?? null,
      })
    );
    this.instructors = unique(
      this.meetings
        .map<string[]>(({ instructors }) => instructors)
        .reduce((accum, instructors) => [...accum, ...instructors], [])
    );

    // These fields are initialized after construction
    // inside `Course.constructor`
    this.associatedLabs = [];
    this.associatedLectures = [];
  }

  async fetchSeating(term: string): Promise<Seating> {
    const prevDate = this.seating[1];
    const currDate = Date.now();

    if (currDate - prevDate > 300000) {
      const url = `${BACKEND_BASE_URL}/proxy/class_section?term=${term}&crn=${this.crn}`;
      return axios({
        url,
        method: 'get',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'text/html',
        },
      })
        .then((response) => {
          if (typeof response.data !== 'string') {
            throw new ErrorWithFields({
              message: 'seating response data was not a string',
              fields: {
                url,
                term,
                crn: this.crn,
              },
            });
          }

          const $ = cheerio.load(response.data);

          const availabilities = $('span').not('.status-bold');
          this.seating = [
            [
              parseInt(availabilities.eq(1).text(), 10),
              parseInt(availabilities.eq(0).text(), 10),
              parseInt(availabilities.eq(3).text(), 10),
              parseInt(availabilities.eq(4).text(), 10),
            ],
            currDate,
          ];

          return this.seating;
        })
        .catch((err) => {
          if (err instanceof ErrorWithFields) {
            softError(err);
          } else {
            softError(
              new ErrorWithFields({
                message: 'seating request failed',
                source: err,
                fields: {
                  url,
                  term,
                  crn: this.crn,
                },
              })
            );
          }

          return [new Array(4).fill('N/A'), currDate];
        });
    }
    return this.seating;
  }
}
