import axios from 'axios';
import { decode } from 'html-entities';

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
import { CLOUD_FUNCTION_BASE_URL } from '../../constants';

// This is actually a transparent read-through cache
// in front of the Course Critique API's course data endpoint,
// but it should behave the same as the real API.
// See the implementation at:
// https://github.com/gt-scheduler/firebase-conf/blob/main/functions/src/course_critique_cache.ts
const COURSE_CRITIQUE_API_URL = `${CLOUD_FUNCTION_BASE_URL}/getCourseDataFromCourseCritique`;

const GPA_CACHE_LOCAL_STORAGE_KEY = 'course-gpa-cache-2';
const GPA_CACHE_EXPIRATION_DURATION_DAYS = 7;

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

    this.title = decode(title);
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
          lecture.associatedLabs = onlyLabs.filter(
            (lab) =>
              matchLabFromInstructors(lab, lecture) &&
              !hasConflictBetween(lab, lecture)
          );
        }
      }
      for (const lab of onlyLabs) {
        lab.associatedLectures = onlyLectures.filter((lecture) =>
          matchLabFromId(lab, lecture)
        );
        if (!lab.associatedLectures.length) {
          lab.associatedLectures = onlyLectures.filter(
            (lecture) =>
              matchLabFromInstructors(lab, lecture) &&
              !hasConflictBetween(lecture, lab)
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
    // Note: if `CourseGpa` ever changes,
    // the cache needs to be invalidated
    // (by changing the local storage key).
    type GpaCache = Record<string, GpaCacheItem>;
    interface GpaCacheItem {
      d: CourseGpa;
      exp: string;
    }

    // Try to look in the cache for a cached course gpa item
    // that has not expired.
    // If it is expired, we don't evict; we just ignore it
    // (and update it with a fresh expiry once it has been fetched).
    // The size of the cache may bloat over time, but shouldn't be substantial.
    try {
      const rawCache = window.localStorage.getItem(GPA_CACHE_LOCAL_STORAGE_KEY);
      if (rawCache != null) {
        const cache: GpaCache = JSON.parse(rawCache) as unknown as GpaCache;
        const cacheItem = cache[this.id];
        if (cacheItem != null) {
          const now = new Date().toISOString();
          // Use lexicographic comparison on date strings
          // (since they are ISO 8601)
          if (now < cacheItem.exp) {
            return cacheItem.d;
          }
        }
      }
    } catch (err) {
      // Ignore
    }

    // Fetch the GPA normally
    const courseGpa = await this.fetchGpaInner();
    if (courseGpa === null) {
      // There was a failure; don't store the value in the cache.
      return {};
    }

    // Store the GPA in the cache
    const exp = new Date();
    exp.setDate(exp.getDate() + GPA_CACHE_EXPIRATION_DURATION_DAYS);
    try {
      let cache: GpaCache = {};
      const rawCache = window.localStorage.getItem(GPA_CACHE_LOCAL_STORAGE_KEY);
      if (rawCache != null) {
        cache = JSON.parse(rawCache) as unknown as GpaCache;
      }

      cache[this.id] = { d: courseGpa, exp: exp.toISOString() };
      const rawUpdatedCache = JSON.stringify(cache);
      window.localStorage.setItem(GPA_CACHE_LOCAL_STORAGE_KEY, rawUpdatedCache);
    } catch (err) {
      // Ignore
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
    const url = `${COURSE_CRITIQUE_API_URL}?courseID=${encodedCourse}`;

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
            },
          })
        );
      }

      return null;
    }

    return this.decodeCourseCritiqueResponse(responseData);
  }

  private decodeCourseCritiqueResponse(
    responseData: CourseDetailsAPIResponse
  ): CourseGpa | null {
    // Calculate the overall course GPA and instructor-specific GPAs
    // from the response.
    // The API response does not actually include these values;
    // instead, it provides GPA information on a per-historical-section-basis,
    // so we have to aggregate this here.
    // As of 2021-11-06, this is also what Course Critique does
    // to determine overall course GPA and instructor-specific GPAs,
    // so there doesn't seem to be a better way
    // (this method is likely inaccurate).

    type IntermediateWeightedAverage = {
      count: number;
      sum: number;
    };

    try {
      const overall: IntermediateWeightedAverage = { count: 0, sum: 0 };
      const instructors: Map<string, IntermediateWeightedAverage> = new Map();

      responseData.raw.forEach((historicalSectionData) => {
        const {
          class_size_group: classSizeGroup,
          instructor_name: rawInstructorName,
          GPA: gpa,
        } = historicalSectionData;

        if (typeof classSizeGroup !== 'string') return;
        if (typeof rawInstructorName !== 'string') return;
        if (typeof gpa !== 'number') return;

        // Map the class size group to an estimate
        // of the number of actual students.
        // This is used as the weight when the average GPA for this section
        // is added to the overall course GPA and instructor-specific GPAs,
        // but it's just a best-estimate and makes the GPAs inaccurate.
        // As of 2021-11-06, these are the same estimates
        // that Course Critique uses in their app
        // (used here since ideally GT Scheduler should report the same GPAs).
        let classSizeEstimate: number;
        switch (classSizeGroup.toLowerCase()) {
          case 'very small (fewer than 10 students)':
            classSizeEstimate = 5;
            break;
          case 'small (10-20 students)':
            classSizeEstimate = 15;
            break;
          case 'mid-size (21-30 students)':
            classSizeEstimate = 25;
            break;
          case 'large (31-49 students)':
            classSizeEstimate = 40;
            break;
          case 'very large (50 students or more)':
            classSizeEstimate = 50;
            break;
          default:
            // Unknown class size group; skip this section
            return;
        }

        // Normalize the instructor name from "LN, FN" to "FN LN"
        let instructorName = decode(rawInstructorName);
        const nameSegments = instructorName.split(', ');
        if (nameSegments.length === 2) {
          const [lastName, firstName] = nameSegments as [string, string];
          instructorName = `${firstName} ${lastName}`;
        }

        // Add the section GPA to the overall GPA
        overall.count += classSizeEstimate;
        overall.sum += gpa * classSizeEstimate;

        // Add the section GPA to the instructor GPA
        const instructorGpa = instructors.get(instructorName) ?? {
          count: 0,
          sum: 0,
        };
        instructorGpa.count += classSizeEstimate;
        instructorGpa.sum += gpa * classSizeEstimate;
        instructors.set(instructorName, instructorGpa);
      });

      // Now, finally compute the actual weighted averages
      // and assemble the `CourseGpa` type:
      const gpaMap: CourseGpa = {};
      if (overall.count > 0) {
        gpaMap.averageGpa = overall.sum / overall.count;
      }
      instructors.forEach((instructorGpa, instructorName) => {
        if (instructorGpa.count > 0) {
          gpaMap[instructorName] = instructorGpa.sum / instructorGpa.count;
        }
      });
      return gpaMap;
    } catch (err) {
      softError(
        new ErrorWithFields({
          message:
            'error extracting course GPA from Course Critique API response',
          source: err,
          fields: {
            id: this.id,
          },
        })
      );
      return null;
    }
  }
}

// Based on response for CS 6035 on 2021-11-06
// from the Course Critique API.
// Each field has `| unknown` added to ensure
// that we narrow the type before using them.
interface CourseDetailsAPIResponse {
  header: [
    {
      course_name: string | null | unknown;
      credits: number | null | unknown;
      description: string | null | unknown;
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
  }>;
}
