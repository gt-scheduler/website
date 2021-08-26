import { Course, Section, SortingOption } from '.';
import { hasConflictBetween, stringToTime } from '../utils';
import {
  Combination,
  Period,
  DateRange,
  Location,
  CrawlerTermData,
  CrawlerCourse
} from '../types';

// `new Oscar(...)` gets the entirety of the crawler JSON data
type OscarConstructionDate = CrawlerTermData;

class Oscar {
  periods: (Period | undefined)[];

  dateRanges: DateRange[];

  scheduleTypes: string[];

  campuses: string[];

  attributes: string[];

  gradeBases: string[];

  locations: (Location | null)[];

  updatedAt: Date;

  version: number;

  courses: Course[];

  courseMap: Record<string, Course | undefined>;

  crnMap: Record<string, Section | undefined>;

  sortingOptions: SortingOption[];

  constructor(data: OscarConstructionDate) {
    const { courses, caches, updatedAt, version } = data;

    this.periods = caches.periods.map((period) => {
      if (period === 'TBA') {
        return undefined;
      }
      return {
        start: stringToTime(period.split(' - ')[0]),
        end: stringToTime(period.split(' - ')[1])
      };
    });
    this.dateRanges = caches.dateRanges.map((dateRange) => {
      const [from, to] = dateRange.split(' - ').map((v) => new Date(v));
      from.setHours(0);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    });
    this.scheduleTypes = caches.scheduleTypes;
    this.campuses = caches.campuses;
    this.attributes = caches.attributes;
    this.gradeBases = caches.gradeBases;
    this.locations = caches.locations;
    this.updatedAt = new Date(updatedAt);
    this.version = version;
    this.courses = Object.keys(courses).map(
      // `courseId` comes from `Object.keys[courses]`,
      // so `courses[courseId]` cannot be undefined
      (courseId) =>
        new Course(this, courseId, courses[courseId] as CrawlerCourse)
    );
    this.courseMap = {};
    this.crnMap = {};
    this.courses.forEach((course) => {
      this.courseMap[course.id] = course;
      course.sections.forEach((section) => {
        this.crnMap[section.crn] = section;
      });
    });
    this.sortingOptions = [
      new SortingOption('Most Compact', (combination) => {
        const { startMap, endMap } = combination;
        const diffs = Object.keys(startMap).map((day) => {
          const end = endMap[day];
          const start = startMap[day];
          if (end == null || start == null) return 0;
          return end - start;
        });
        const sum = diffs.reduce((tot, min) => tot + min, 0);
        return +sum;
      }),
      new SortingOption('Earliest Ending', (combination) => {
        const { endMap } = combination;
        const ends = Object.values(endMap) as number[];
        const sum = ends.reduce<number>((tot, end) => tot + (end ?? 0), 0);
        const avg = sum / ends.length;
        return +avg;
      }),
      new SortingOption('Latest Beginning', (combination) => {
        const { startMap } = combination;
        const starts = Object.values(startMap);
        const sum = starts.reduce<number>((tot, min) => tot + (min ?? 0), 0);
        const avg = sum / starts.length;
        return -avg;
      })
    ];
  }

  findCourse(courseId: string): Course | undefined {
    return this.courseMap[courseId];
  }

  findSection(crn: string): Section | undefined {
    return this.crnMap[crn];
  }

  getCombinations(
    desiredCourses: string[],
    pinnedCrns: string[],
    excludedCrns: string[]
  ): Combination[] {
    const crnsList: string[][] = [];
    const dfs = (courseIndex: number = 0, crns: string[] = []): void => {
      if (courseIndex === desiredCourses.length) {
        crnsList.push(crns);
        return;
      }
      const course = this.findCourse(desiredCourses[courseIndex]);
      if (course === undefined) return;
      const isIncluded = (section: Section) =>
        !excludedCrns.includes(section.crn);
      const isPinned = (section: Section) => pinnedCrns.includes(section.crn);
      const hasConflict = (section: Section) =>
        [...pinnedCrns, ...crns].some((crn) => {
          const crnSection = this.findSection(crn);
          if (crnSection === undefined) return false;
          return hasConflictBetween(crnSection, section);
        });
      if (course.hasLab) {
        // If a course has a lab, then `onlyLectures`, `onlyLabs`,
        // and `allInOnes` should be non-undefined, but we have to check
        // anyways here to satisfy TypeScript
        const pinnedOnlyLecture = (course.onlyLectures ?? []).find(isPinned);
        const pinnedOnlyLab = (course.onlyLabs ?? []).find(isPinned);
        const pinnedAllInOne = (course.allInOnes ?? []).find(isPinned);
        if ((pinnedOnlyLecture && pinnedOnlyLab) || pinnedAllInOne) {
          dfs(courseIndex + 1, crns);
        } else if (pinnedOnlyLecture) {
          pinnedOnlyLecture.associatedLabs.filter(isIncluded).forEach((lab) => {
            if (hasConflict(lab)) return;
            dfs(courseIndex + 1, [...crns, lab.crn]);
          });
        } else if (pinnedOnlyLab) {
          pinnedOnlyLab.associatedLectures
            .filter(isIncluded)
            .forEach((lecture) => {
              if (hasConflict(lecture)) return;
              dfs(courseIndex + 1, [...crns, lecture.crn]);
            });
        } else {
          (course.onlyLectures ?? []).filter(isIncluded).forEach((lecture) => {
            if (hasConflict(lecture)) return;
            lecture.associatedLabs.filter(isIncluded).forEach((lab) => {
              if (hasConflict(lab)) return;
              dfs(courseIndex + 1, [...crns, lecture.crn, lab.crn]);
            });
          });
          (course.allInOnes ?? []).filter(isIncluded).forEach((section) => {
            if (hasConflict(section)) return;
            dfs(courseIndex + 1, [...crns, section.crn]);
          });
        }
      } else if (course.sections.some(isPinned)) {
        dfs(courseIndex + 1, crns);
      } else {
        // If a course does not have a lab, then `sectionGroups` should be
        // non-undefined, but we have to check anyways here to satisfy
        // TypeScript
        Object.values(course.sectionGroups ?? []).forEach((sectionGroup) => {
          if (sectionGroup == null) return;
          const section = sectionGroup.sections.find(isIncluded);
          if (!section || hasConflict(section)) return;
          dfs(courseIndex + 1, [...crns, section.crn]);
        });
      }
    };
    dfs();
    return crnsList.map((crns) => {
      const startMap: Record<string, number | undefined> = {};
      const endMap: Record<string, number | undefined> = {};
      this.iterateTimeBlocks([...pinnedCrns, ...crns], (day, period) => {
        if (period === undefined) return;
        const end = endMap[day];
        const start = startMap[day];
        if (start == null || start > period.start) startMap[day] = period.start;
        if (end == null || end < period.end) endMap[day] = period.end;
      });
      return {
        crns,
        startMap,
        endMap
      };
    });
  }

  sortCombinations(
    combinations: Combination[],
    sortingOptionIndex: number
  ): Combination[] {
    const sortingOption = this.sortingOptions[sortingOptionIndex];
    return combinations
      .map((combination) => ({
        ...combination,
        factor: sortingOption.calculateFactor(combination)
      }))
      .sort((a, b) => a.factor - b.factor);
  }

  iterateTimeBlocks(
    crns: string[],
    callback: (day: string, period: Period | undefined) => void
  ): void {
    crns.forEach((crn) => {
      const section = this.findSection(crn);
      if (section !== undefined) {
        section.meetings.forEach(
          (meeting) =>
            meeting.period &&
            meeting.days.forEach((day) => {
              callback(day, meeting.period);
            })
        );
      }
    });
  }
}

export default Oscar;

/**
 * Create an empty instance of the Oscar bean
 * to use as the default context value
 */
export const EMPTY_OSCAR = new Oscar({
  courses: {},
  caches: {
    periods: [],
    dateRanges: [],
    scheduleTypes: [],
    campuses: [],
    attributes: [],
    gradeBases: [],
    locations: []
  },
  updatedAt: new Date(),
  version: 1
});
