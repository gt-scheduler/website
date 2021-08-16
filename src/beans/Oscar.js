import { Course, SortingOption } from '.';
import { hasConflictBetween, stringToTime } from '../utils';

class Oscar {
  constructor(data) {
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
      (courseId) => new Course(this, courseId, courses[courseId])
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
        const diffs = Object.keys(startMap).map(
          (day) => endMap[day] - startMap[day]
        );
        const sum = diffs.reduce((tot, min) => tot + min, 0);
        return +sum;
      }),
      new SortingOption('Earliest Ending', (combination) => {
        const { endMap } = combination;
        const ends = Object.values(endMap);
        const sum = ends.reduce((tot, end) => tot + end, 0);
        const avg = sum / ends.length;
        return +avg;
      }),
      new SortingOption('Latest Beginning', (combination) => {
        const { startMap } = combination;
        const starts = Object.values(startMap);
        const sum = starts.reduce((tot, min) => tot + min, 0);
        const avg = sum / starts.length;
        return -avg;
      })
    ];
  }

  findCourse(courseId) {
    return this.courseMap[courseId];
  }

  findSection(crn) {
    return this.crnMap[crn];
  }

  getCombinations(desiredCourses, pinnedCrns, excludedCrns) {
    // idea: do with a stack, then you can easily break out
    const crnsList = [];
    const stack = [[0, []]]; // seed the stack with default values

    while (stack.length > 0 && crnsList.length < 1000) {
      // max number here
      // if (crnsList.length >= 1000) {
      //   break;
      // }

      // process next value on stack
      const [courseIndex, crns] = stack.pop();
      // console.log(courseIndex, crns);

      // apparently this isn't allowed because of husky linting no-continue
      // if (courseIndex === desiredCourses.length) {
      //   crnsList.push(crns);
      //   // return;
      //   continue;
      // }

      if (courseIndex === desiredCourses.length) {
        crnsList.push(crns);
      } else {
        const course = this.findCourse(desiredCourses[courseIndex]);
        const isIncluded = (section) => !excludedCrns.includes(section.crn);
        const isPinned = (section) => pinnedCrns.includes(section.crn);
        const hasConflict = (section) =>
          [...pinnedCrns, ...crns].some((crn) =>
            hasConflictBetween(this.findSection(crn), section)
          );
        if (course.hasLab) {
          const pinnedOnlyLecture = course.onlyLectures.find(isPinned);
          const pinnedOnlyLab = course.onlyLabs.find(isPinned);
          const pinnedAllInOne = course.allInOnes.find(isPinned);
          if ((pinnedOnlyLecture && pinnedOnlyLab) || pinnedAllInOne) {
            // dfs(courseIndex + 1, crns);
            stack.push([courseIndex + 1, crns]);
          } else if (pinnedOnlyLecture) {
            pinnedOnlyLecture.associatedLabs
              .filter(isIncluded)
              .forEach((lab) => {
                if (hasConflict(lab)) return;
                // dfs(courseIndex + 1, [...crns, lab.crn]);
                stack.push([courseIndex + 1, [...crns, lab.crn]]);
              });
          } else if (pinnedOnlyLab) {
            pinnedOnlyLab.associatedLectures
              .filter(isIncluded)
              .forEach((lecture) => {
                if (hasConflict(lecture)) return;
                // dfs(courseIndex + 1, [...crns, lecture.crn]);
                stack.push([courseIndex + 1, [...crns, lecture.crn]]);
              });
          } else {
            course.onlyLectures.filter(isIncluded).forEach((lecture) => {
              if (hasConflict(lecture)) return;
              lecture.associatedLabs.filter(isIncluded).forEach((lab) => {
                if (hasConflict(lab)) return;
                // dfs(courseIndex + 1, [...crns, lecture.crn, lab.crn]);
                stack.push([courseIndex + 1, [...crns, lecture.crn, lab.crn]]);
              });
            });
            course.allInOnes.filter(isIncluded).forEach((section) => {
              if (hasConflict(section)) return;
              // dfs(courseIndex + 1, [...crns, section.crn]);
              stack.push([courseIndex + 1, [...crns, section.crn]]);
            });
          }
        } else if (course.sections.some(isPinned)) {
          // dfs(courseIndex + 1, crns);
          stack.push([courseIndex + 1, crns]);
        } else {
          Object.values(course.sectionGroups).forEach((sectionGroup) => {
            // if (crnsList.length >= 1000) {
            //   return;
            // }

            const section = sectionGroup.sections.find(isIncluded);
            if (!section || hasConflict(section)) return;
            // dfs(courseIndex + 1, [...crns, section.crn]);
            stack.push([courseIndex + 1, [...crns, section.crn]]);
          });
        }
      }
    }

    // const dfs = (courseIndex = 0, crns = []) => {
    //   if (crnsList.length >= 1000) {
    //     return;
    //   }

    //   if (courseIndex === desiredCourses.length) {
    //     crnsList.push(crns);
    //     return;
    //   }
    //   const course = this.findCourse(desiredCourses[courseIndex]);
    //   const isIncluded = (section) => !excludedCrns.includes(section.crn);
    //   const isPinned = (section) => pinnedCrns.includes(section.crn);
    //   const hasConflict = (section) =>
    //     [...pinnedCrns, ...crns].some((crn) =>
    //       hasConflictBetween(this.findSection(crn), section)
    //     );
    //   if (course.hasLab) {
    //     const pinnedOnlyLecture = course.onlyLectures.find(isPinned);
    //     const pinnedOnlyLab = course.onlyLabs.find(isPinned);
    //     const pinnedAllInOne = course.allInOnes.find(isPinned);
    //     if ((pinnedOnlyLecture && pinnedOnlyLab) || pinnedAllInOne) {
    //       dfs(courseIndex + 1, crns);
    //     } else if (pinnedOnlyLecture) {
    // pinnedOnlyLecture.associatedLabs.filter(isIncluded).forEach((lab) => {
    //         if (hasConflict(lab)) return;
    //         dfs(courseIndex + 1, [...crns, lab.crn]);
    //       });
    //     } else if (pinnedOnlyLab) {
    //       pinnedOnlyLab.associatedLectures
    //         .filter(isIncluded)
    //         .forEach((lecture) => {
    //           if (hasConflict(lecture)) return;
    //           dfs(courseIndex + 1, [...crns, lecture.crn]);
    //         });
    //     } else {
    //       course.onlyLectures.filter(isIncluded).forEach((lecture) => {
    //         if (hasConflict(lecture)) return;
    //         lecture.associatedLabs.filter(isIncluded).forEach((lab) => {
    //           if (hasConflict(lab)) return;
    //           dfs(courseIndex + 1, [...crns, lecture.crn, lab.crn]);
    //         });
    //       });
    //       course.allInOnes.filter(isIncluded).forEach((section) => {
    //         if (hasConflict(section)) return;
    //         dfs(courseIndex + 1, [...crns, section.crn]);
    //       });
    //     }
    //   } else if (course.sections.some(isPinned)) {
    //     dfs(courseIndex + 1, crns);
    //   } else {
    //     Object.values(course.sectionGroups).forEach((sectionGroup) => {
    //       if (crnsList.length >= 1000) {
    //         return;
    //       }

    //       const section = sectionGroup.sections.find(isIncluded);
    //       if (!section || hasConflict(section)) return;
    //       dfs(courseIndex + 1, [...crns, section.crn]);
    //     });
    //   }
    // };
    // dfs();
    // console.log(crnsList);

    return crnsList.map((crns) => {
      const startMap = {};
      const endMap = {};
      this.iterateTimeBlocks([...pinnedCrns, ...crns], (day, period) => {
        if (!(day in startMap) || startMap[day] > period.start)
          startMap[day] = period.start;
        if (!(day in endMap) || endMap[day] < period.end)
          endMap[day] = period.end;
      });
      return {
        crns,
        startMap,
        endMap
      };
    });
  }

  sortCombinations(combinations, sortingOptionIndex) {
    const sortingOption = this.sortingOptions[sortingOptionIndex];
    return combinations
      .map((combination) => ({
        ...combination,
        factor: sortingOption.calculateFactor(combination)
      }))
      .sort((a, b) => a.factor - b.factor);
  }

  iterateTimeBlocks(crns, callback) {
    crns.forEach((crn) => {
      this.findSection(crn).meetings.forEach(
        (meeting) =>
          meeting.period &&
          meeting.days.forEach((day) => {
            callback(day, meeting.period);
          })
      );
    });
  }
}

export default Oscar;
