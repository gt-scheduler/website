import axios from 'axios';

import { Oscar, Section } from '.';
import {
  CourseGpa,
  CrawlerCourse,
  CrawlerPrerequisites,
  Period,
  SafeRecord
} from '../types';
import { hasConflictBetween, isLab, isLecture } from '../utils';
import { softError } from '../log';

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

  sectionGroups: SafeRecord<string, SectionGroup> | undefined;

  constructor(oscar: Oscar, courseId: string, data: CrawlerCourse) {
    const [title, sections, prereqs] = data;

    this.id = courseId;
    [this.subject, this.number] = this.id.split(' ');
    this.title = title;
    this.sections = Object.keys(sections).flatMap<Section>((sectionId) => {
      const crawlerSection = sections[sectionId];
      if (crawlerSection == null) return [];
      return [new Section(oscar, this, sectionId, crawlerSection)];
    });
    this.prereqs = prereqs;

    const onlyLectures = this.sections.filter(
      (section) => isLecture(section) && !isLab(section)
    );
    const onlyLabs = this.sections.filter(
      (section) => isLab(section) && !isLecture(section)
    );
    this.hasLab = !!onlyLectures.length && !!onlyLabs.length;
    if (this.hasLab) {
      for (const lecture of onlyLectures) {
        lecture.associatedLabs = onlyLabs.filter((lab) =>
          lab.id.startsWith(lecture.id)
        );
      }
      for (const lab of onlyLabs) {
        lab.associatedLectures = onlyLectures.filter((lecture) =>
          lab.id.startsWith(lecture.id)
        );
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

  distinct(sections: Section[]): SafeRecord<string, SectionGroup> {
    const groups: SafeRecord<string, SectionGroup> = {};
    sections.forEach((section) => {
      const sectionGroupMeetings = section.meetings.map<SectionGroupMeeting>(
        ({ days, period }) => ({
          days,
          period
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
          sections: [section]
        };
      }
    });
    return groups;
  }

  async fetchGpa(): Promise<CourseGpa> {
    const base =
      'https://c4citk6s9k.execute-api.us-east-1.amazonaws.com/test/data';
    // We have to clean up the course ID before sending it to the API,
    // since courses like CHEM 1212K should become CHEM 1212
    let { id } = this;
    try {
      const [subject, number] = id.split(' ');
      id = `${subject} ${number.replace(/\D/g, '')}`;
    } catch (_) {
      // Ignore errors during cleaning
    }
    const encodedCourse = encodeURIComponent(id);
    const url = `${base}/course?courseID=${encodedCourse}`;

    let responseData: CourseDetailsAPIResponse;
    try {
      responseData = (await axios.get<CourseDetailsAPIResponse>(url)).data;
    } catch (err) {
      softError(`fetching course details from Course Critique API`, err, {
        baseId: this.id,
        cleanedId: id,
        url
      });
      return {};
    }

    // Extract the relevant fields from the response
    // We catch (or even throw) errors here to defensively ensure that
    // the data coming out of this function is safely typed
    try {
      const gpaMap: CourseGpa = {};

      // Extract the course-wide average GPA
      const rawAverageGpa = responseData.header[0].avg_gpa;
      if (typeof rawAverageGpa !== 'number')
        throw new Error(`data at ".header[0].avg_gpa" was not a number`);
      gpaMap.averageGpa = rawAverageGpa;

      // Extract the GPA for each instructor
      responseData.raw.forEach((instructorData, i) => {
        // Extract the instructor's name
        const rawInstructor = instructorData.instructor_name;
        if (typeof rawInstructor !== 'string')
          throw new Error(
            `data at ".raw[${i}].instructor_name" was not a string`
          );

        // Extract the instructor's GPA
        const instructorGpa = instructorData.GPA;
        if (typeof instructorGpa !== 'number')
          throw new Error(`data at ".raw[${i}].GPA" was not a number`);

        // Normalize the instructor name from "LN, FN" to "FN LN"
        let instructor = rawInstructor;
        if (instructor.indexOf(',') !== -1) {
          const [lastName, firstName] = instructor.split(', ');
          instructor = `${firstName} ${lastName}`;
        }

        gpaMap[instructor] = instructorGpa;
      });

      return gpaMap;
    } catch (err) {
      softError(
        `extracting course GPA from Course Critique API response`,
        err,
        {
          baseId: this.id,
          cleanedId: id,
          url,
          responseData
        }
      );
      return {};
    }
  }
}

// Based on response for CS 6035 on 2021-08-28
// from the Course Critique API
interface CourseDetailsAPIResponse {
  header: Array<{
    course_name: string;
    description: string;
    credits: number;
    avg_gpa: number;
    avg_a: number;
    avg_b: number;
    avg_c: number;
    avg_d: number;
    avg_f: number;
    avg_w: number;
    full_name: string;
  }>;
  raw: Array<{
    instructor_gt_username: string;
    instructor_name: string;
    link: string;
    class_size_group: string;
    GPA: number;
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
    W: number;
    sections: number;
  }>;
}
