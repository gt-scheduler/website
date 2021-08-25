import axios from 'axios';
import { Oscar, Section } from '.';
import {
  CourseGpa,
  CrawlerCourse,
  CrawlerPrerequisites,
  Period
} from '../types';
import { hasConflictBetween, isLab, isLecture } from '../utils';

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

class Course {
  id: string;

  subject: string;

  number: string;

  title: string;

  sections: Section[];

  prereqs: CrawlerPrerequisites;

  hasLab: boolean;

  onlyLectures: Section[] | undefined;

  onlyLabs: Section[] | undefined;

  allInOnes: Section[] | undefined;

  sectionGroups: Record<string, SectionGroup | undefined> | undefined;

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

  distinct(sections: Section[]): Record<string, SectionGroup | undefined> {
    const groups: Record<string, SectionGroup | undefined> = {};
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
    return axios({
      url: `${base}/course?courseID=${encodedCourse}`,
      method: 'get'
    })
      .then((response) => {
        const { data } = response;
        const averageGpa = data.header[0].avg_gpa;
        const gpaMap: CourseGpa = { averageGpa };

        data.raw.forEach((datum: { instructor_name: string; GPA: number }) => {
          const instructor = datum.instructor_name;
          const gpa = datum.GPA;

          const [lastName, firstName] = instructor.split(', ');
          const fullName = `${firstName} ${lastName}`;
          gpaMap[fullName] = gpa;
        });

        return gpaMap;
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        return {};
      });
  }
}

export default Course;
