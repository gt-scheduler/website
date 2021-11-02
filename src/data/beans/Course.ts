import axios from 'axios';

import { Oscar, Section } from '.';
import {
  CourseGpa,
  CrawlerCourse,
  CrawlerPrerequisites,
  Period,
} from '../../types';
import {
  hasConflictBetween,
  isLab,
  isLecture,
  isAxiosNetworkError,
} from '../../utils/misc';
import { ErrorWithFields, softError } from '../../log';

const COURSE_CRITIQUE_API_URL =
  'https://c4citk6s9k.execute-api.us-east-1.amazonaws.com/test/data';

interface SectionGroupMeeting {
  days: string[];
  period: Period | undefined;
}

interface SectionGroup {
  /**
   * Equal to`JSON.stringify(this.sectionGroupMeetings)`
   */
  hash: string;
  meetings: SectionGroupMeeting[];
  sections: Section[];
}

export default class Course {
  id: string;

  subject: string;

  number: string;

  title: string;

  sections: Section[];

  prereqs: CrawlerPrerequisites | undefined;

  hasLab: boolean;

  onlyLectures: Section[] | undefined;

  onlyLabs: Section[] | undefined;

  allInOnes: Section[] | undefined;

  sectionGroups: Record<string, SectionGroup> | undefined;

  term: string;

  constructor(oscar: Oscar, courseId: string, data: CrawlerCourse) {
    this.term = oscar.term;
    const [title, sections, prereqs] = data;

    this.id = courseId;
    const [subject, number] = this.id.split(' ');
    if (subject == null || number == null) {
      throw new ErrorWithFields({
        message: 'course ID could not be parsed',
        fields: {
          id: this.id,
          subject,
          number,
          term: this.term,
        },
      });
    }
    this.subject = subject;
    this.number = number;

    this.title = title;
    this.sections = Object.entries(sections).flatMap<Section>(
      ([sectionId, sectionData]) => {
        if (sectionData == null) return [];
        try {
          return [new Section(oscar, this, sectionId, sectionData)];
        } catch (err) {
          softError(
            new ErrorWithFields({
              message: 'could not construct Section bean',
              source: err,
              fields: {
                courseId,
                term: this.term,
              },
            })
          );
          return [];
        }
      }
    );
    this.prereqs = prereqs;

    const onlyLectures = this.sections.filter(
      (section) => isLecture(section) && !isLab(section)
    );
    const onlyLabs = this.sections.filter(
      (section) => isLab(section) && !isLecture(section)
    );
    this.hasLab = !!onlyLectures.length && !!onlyLabs.length;
    if (this.hasLab) {
      const matchLabFromId = (lab: Section, lecture: Section): boolean =>
        // note: checking both ways because GT registrar
        // reversed studio and lecture sections for MATH 1553
        lecture.id.startsWith(lab.id) || lab.id.startsWith(lecture.id);
      const matchLabFromInstructors = (
        lab: Section,
        lecture: Section
      ): boolean =>
        // match lecture and lab sections
        // if there are *any* matching instructors
        // fixes issue with PHYS 2211 and 2212
        // no longer matching section id letters
        lab.instructors.filter((instructor) =>
          lecture.instructors.includes(instructor)
        ).length > 0;

      for (const lecture of onlyLectures) {
        lecture.associatedLabs = onlyLabs.filter((lab) =>
          matchLabFromId(lab, lecture)
        );
        // if no matching section id letters found, match by profs
        if (!lecture.associatedLabs.length) {
          lecture.associatedLabs = onlyLabs.filter((lab) =>
            matchLabFromInstructors(lab, lecture)
          );
        }
      }
      for (const lab of onlyLabs) {
        lab.associatedLectures = onlyLectures.filter((lecture) =>
          matchLabFromId(lab, lecture)
        );
        if (!lab.associatedLectures.length) {
          lab.associatedLectures = onlyLectures.filter((lecture) =>
            matchLabFromInstructors(lab, lecture)
          );
        }
      }
      const lonelyLectures = onlyLectures.filter(
        (lecture) => !lecture.associatedLabs.length
      );
      const lonelyLabs = onlyLabs.filter(
        (lab) => !lab.associatedLectures.length
      );
      for (const lecture of lonelyLectures) {
        lecture.associatedLabs = lonelyLabs.filter(
          (lab) => !hasConflictBetween(lecture, lab)
        );
      }
      for (const lab of lonelyLabs) {
        lab.associatedLectures = lonelyLectures.filter(
          (lecture) => !hasConflictBetween(lecture, lab)
        );
      }
      this.onlyLectures = onlyLectures;
      this.onlyLabs = onlyLabs;
      this.allInOnes = this.sections.filter(
        (section) => isLecture(section) && isLab(section)
      );
    } else {
      this.sectionGroups = this.distinct(this.sections);
    }
  }

  distinct(sections: Section[]): Record<string, SectionGroup> {
    const groups: Record<string, SectionGroup> = {};
    sections.forEach((section) => {
      const sectionGroupMeetings = section.meetings.map<SectionGroupMeeting>(
        ({ days, period }) => ({
          days,
          period,
        })
      );
      const sectionGroupHash = JSON.stringify(sectionGroupMeetings);
      const sectionGroup = groups[sectionGroupHash];
      if (sectionGroup) {
        sectionGroup.sections.push(section);
      } else {
        groups[sectionGroupHash] = {
          hash: sectionGroupHash,
          meetings: sectionGroupMeetings,
          sections: [section],
        };
      }
    });
    return groups;
  }

  async fetchGpa(): Promise<CourseGpa> {
    const courseGpa = await this.fetchGpaInner();
    if (courseGpa === null) {
      return {};
    }

    return courseGpa;
  }

  /**
   * Fetches the course GPA without caching it
   * @see `fetchGpa` for the persistent-caching version
   * @returns the course GPA if successfully fetched from course critique,
   * or `null` if there was a problem.
   * Note that the empty object `{}` is a valid course GPA value,
   * but we prefer returning `null` if there was a failure
   * so we can avoid storing the empty GPA value in the persistent cache.
   */
  private async fetchGpaInner(): Promise<CourseGpa | null> {
    // We have to clean up the course ID before sending it to the API,
    // since courses like CHEM 1212K should become CHEM 1212
    const id = `${this.subject} ${this.number.replace(/\D/g, '')}`;
    const encodedCourse = encodeURIComponent(id);
    const url = `${COURSE_CRITIQUE_API_URL}/course?courseID=${encodedCourse}`;

    let responseData: CourseDetailsAPIResponse;
    try {
      responseData = (await axios.get<CourseDetailsAPIResponse>(url)).data;
    } catch (err) {
      // Ignore network errors
      if (!isAxiosNetworkError(err)) {
        softError(
          new ErrorWithFields({
            message: 'error fetching course details from Course Critique API',
            source: err,
            fields: {
              baseId: this.id,
              cleanedId: id,
              url,
              term: this.term,
            },
          })
        );
      }

      return {};
    }

    // Extract the relevant fields from the response
    // We catch (or even throw) errors here to defensively ensure that
    // the data coming out of this function is safely typed
    try {
      const gpaMap: CourseGpa = {};

      // Extract the course-wide average GPA
      const rawAverageGpa = responseData.header[0].avg_gpa;
      // If the field is null, then the course has no GPA information
      if (rawAverageGpa === null) return {};
      if (typeof rawAverageGpa !== 'number')
        throw new ErrorWithFields({
          message: `data at ".header[0].avg_gpa" was not a number`,
          fields: {
            actual: rawAverageGpa,
            term: this.term,
          },
        });
      gpaMap.averageGpa = rawAverageGpa;

      // Extract the GPA for each instructor
      responseData.raw.forEach((instructorData, i) => {
        // Extract the instructor's name
        const rawInstructor = instructorData.instructor_name;
        if (typeof rawInstructor !== 'string')
          throw new ErrorWithFields({
            message: `data at ".raw[idx].instructor_name" was not a string`,
            fields: {
              idx: i,
              actual: rawInstructor,
              term: this.term,
            },
          });

        // Extract the instructor's GPA
        const instructorGpa = instructorData.GPA;
        if (typeof instructorGpa !== 'number')
          throw new ErrorWithFields({
            message: `data at ".raw[idx].GPA" was not a number`,
            fields: {
              idx: i,
              actual: instructorGpa,
              term: this.term,
            },
          });

        // Normalize the instructor name from "LN, FN" to "FN LN"
        let instructor = rawInstructor;
        const nameSegments = instructor.split(', ');
        if (nameSegments.length === 2) {
          const [lastName, firstName] = nameSegments as [string, string];
          instructor = `${firstName} ${lastName}`;
        }

        gpaMap[instructor] = instructorGpa;
      });

      return gpaMap;
    } catch (err) {
      softError(
        new ErrorWithFields({
          message:
            'error extracting course GPA from Course Critique API response',
          source: err,
          fields: {
            baseId: this.id,
            cleanedId: id,
            url,
            term: this.term,
          },
        })
      );
      return {};
    }
  }
}

// Based on response for CS 6035 on 2021-08-28
// from the Course Critique API.
// Each field has `| unknown` added to ensure
// that we narrow the type before using them.
interface CourseDetailsAPIResponse {
  header: [
    {
      course_name: string | null | unknown;
      description: string | null | unknown;
      credits: number | null | unknown;
      avg_gpa: number | null | unknown;
      avg_a: number | null | unknown;
      avg_b: number | null | unknown;
      avg_c: number | null | unknown;
      avg_d: number | null | unknown;
      avg_f: number | null | unknown;
      avg_w: number | null | unknown;
      full_name: string | null | unknown;
    }
  ];
  raw: Array<{
    instructor_gt_username: string | unknown;
    instructor_name: string | unknown;
    link: string | unknown;
    class_size_group: string | unknown;
    GPA: number | unknown;
    A: number | unknown;
    B: number | unknown;
    C: number | unknown;
    D: number | unknown;
    F: number | unknown;
    W: number | unknown;
    sections: number | unknown;
  }>;
}
