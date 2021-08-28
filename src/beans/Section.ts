import axios from 'axios';
import cheerio from 'cheerio';
import { unique } from '../utils';
import { DELIVERY_MODES, BACKEND_BASE_URL } from '../constants';
import Course from './Course';
import Oscar from './Oscar';
import { CrawlerMeeting, Meeting } from '../types';

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

  constructor(
    oscar: Oscar,
    course: Course,
    sectionId: string,
    data: SectionConstructionData
  ) {
    const [
      crn,
      meetings,
      credits,
      scheduleTypeIndex,
      campusIndex,
      attributeIndices,
      gradeBasisIndex
    ] = data;

    this.course = course;
    this.id = sectionId;
    this.crn = crn;
    this.seating = [[], 0];
    this.credits = credits;
    this.scheduleType = oscar.scheduleTypes[scheduleTypeIndex];
    this.campus = oscar.campuses[campusIndex];

    const attributes = attributeIndices.map(
      (attributeIndex) => oscar.attributes[attributeIndex]
    );
    this.deliveryMode = attributes.find(
      (attribute) => attribute in DELIVERY_MODES
    );

    this.gradeBasis = oscar.gradeBases[gradeBasisIndex];
    this.meetings = meetings.map<Meeting>(
      ([
        periodIndex,
        days,
        where,
        locationIndex,
        instructors,
        dateRangeIndex
      ]) => ({
        period: oscar.periods[periodIndex],
        days: days === '&nbsp;' ? [] : days.split(''),
        where,
        location: oscar.locations[locationIndex],
        instructors: instructors.map((instructor) =>
          instructor.replace(/ \(P\)$/, '')
        ),
        dateRange: oscar.dateRanges[dateRangeIndex]
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
          'Content-Type': 'text/html'
        }
      })
        .then((response) => {
          const $ = cheerio.load(response.data);
          const availabilityTable = $('.datadisplaytable .datadisplaytable');
          const tableRow = availabilityTable.find('tr');

          this.seating = [
            [
              parseInt(tableRow.eq(1).children('td').first().text(), 10),
              parseInt(tableRow.eq(1).children('td').eq(1).text(), 10),
              parseInt(tableRow.eq(2).children('td').first().text(), 10),
              parseInt(tableRow.eq(2).children('td').eq(1).text(), 10)
            ],
            currDate
          ];

          return this.seating;
        })
        .catch(() => [new Array(4).fill('N/A'), currDate]);
    }
    return this.seating;
  }
}
