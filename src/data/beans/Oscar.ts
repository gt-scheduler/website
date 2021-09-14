import { Course, Section, SortingOption } from '.';
import { hasConflictBetween, stringToTime } from '../../utils/misc';
import {
  Combination,
  Period,
  DateRange,
  Location,
  CrawlerTermData,
} from '../../types';
import { ErrorWithFields, softError } from '../../log';

// `new Oscar(...)` gets the entirety of the crawler JSON data
type OscarConstructionDate = CrawlerTermData;

export default class Oscar {
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

  courseMap: Record<string, Course>;

  crnMap: Record<string, Section>;

  sortingOptions: SortingOption[];

  constructor(data: OscarConstructionDate, public term: string) {
    const { courses, caches, updatedAt, version } = data;

    this.periods = caches.periods.map((period, i) => {
      if (period === 'TBA') {
        return undefined;
      }

      const periodSegments = period.split(' - ');
      if (periodSegments.length !== 2) {
        softError(
          new ErrorWithFields({
            message: 'period did not follow expected format',
            fields: {
              period,
              cacheIndex: i,
              term: this.term,
            },
          })
        );
        return undefined;
      }

      const [start, end] = periodSegments as [string, string];
      return {
        start: stringToTime(start),
        end: stringToTime(end),
      };
    });

    this.dateRanges = caches.dateRanges.map((dateRange, i) => {
      let segments = dateRange.split(' - ');
      if (segments.length !== 2) {
        softError(
          new ErrorWithFields({
            message: 'date range did not follow expected format',
            fields: {
              dateRange,
              cacheIndex: i,
              term: this.term,
            },
          })
        );
        // We need some fallback here
        segments = ['Jan 1, 1970', 'Jan 2, 1970'];
      }

      const [from, to] = segments.map((v) => new Date(v)) as [Date, Date];
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

    this.courses = Object.entries(courses).flatMap(([courseId, source]) => {
      try {
        return [new Course(this, courseId, source)];
      } catch (err) {
        softError(
          new ErrorWithFields({
            message: 'could not initialize Course bean',
            fields: {
              courseId,
              source,
              term: this.term,
            },
          })
        );
        return [];
      }
    });

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
        const ends = Object.values(endMap);
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
      }),
    ];
  }

  findCourse(courseId: string): Course | undefined {
    return this.courseMap[courseId];
  }

  findSection(crn: string): Section | undefined {
    return this.crnMap[crn];
  }

  getCombinations(
    desiredCourses: readonly string[],
    pinnedCrns: readonly string[],
    excludedCrns: readonly string[]
  ): Combination[] {
    const crnsList: string[][] = [];
    const dfs = (courseIndex = 0, crns: string[] = []): void => {
      if (courseIndex === desiredCourses.length) {
        crnsList.push(crns);
        return;
      }
      const courseId = desiredCourses[courseIndex];
      if (courseId === undefined) return;
      const course = this.findCourse(courseId);
      if (course === undefined) return;
      const isIncluded = (section: Section): boolean =>
        !excludedCrns.includes(section.crn);
      const isPinned = (section: Section): boolean =>
        pinnedCrns.includes(section.crn);
      const hasConflict = (section: Section): boolean =>
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
        Object.values(course.sectionGroups ?? {}).forEach((sectionGroup) => {
          if (sectionGroup == null) return;
          const section = sectionGroup.sections.find(isIncluded);
          if (!section || hasConflict(section)) return;
          dfs(courseIndex + 1, [...crns, section.crn]);
        });
      }
    };
    dfs();
    return crnsList.map((crns) => {
      const startMap: Record<string, number> = {};
      const endMap: Record<string, number> = {};
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
        endMap,
      };
    });
  }

  sortCombinations(
    combinations: Combination[],
    sortingOptionIndex: number
  ): Combination[] {
    const sortingOption = this.sortingOptions[sortingOptionIndex];
    if (sortingOption === undefined) {
      throw new ErrorWithFields({
        message: `sorting option index was out of bounds`,
        fields: {
          sortingOptionIndex,
          actualSortingOptionsLength: this.sortingOptions.length,
          term: this.term,
        },
      });
    }

    return combinations
      .map((combination) => ({
        ...combination,
        factor: sortingOption.calculateFactor(combination),
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

/**
 * Create an empty instance of the Oscar bean
 * to use as the default context value
 */
export const EMPTY_OSCAR = new Oscar(
  {
    courses: {},
    caches: {
      periods: [],
      dateRanges: [],
      scheduleTypes: [],
      campuses: [],
      attributes: [],
      gradeBases: [],
      locations: [],
    },
    // This converts the Date to the expected string
    // that it serializes to in the crawler
    updatedAt: JSON.parse(JSON.stringify(new Date())) as string,
    version: 1,
  },
  '197008'
);
