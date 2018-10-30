import { Course } from './';
import { hasConflictBetween } from '../utils';

class Oscar {
  constructor(data) {
    this.courses = Object.keys(data).map(courseId => new Course(courseId, data[courseId]));
    this.courseMap = {};
    this.crnMap = {};
    this.courses.forEach(course => {
      this.courseMap[course.id] = course;
      course.sections.forEach(section => {
        this.crnMap[section.crn] = section;
      });
    });
  }

  findCourse(courseId) {
    return this.courseMap[courseId];
  }

  findSection(crn) {
    return this.crnMap[crn];
  }

  searchCourses(keyword) {
    const [, subject, number] = /^\s*([a-zA-Z]*)\s*(\d*)\s*$/.exec(keyword.toUpperCase()) || [];
    if (subject && number) {
      return this.courses.filter(course => course.subject === subject && course.number.startsWith(number));
    } else if (subject) {
      return this.courses.filter(course => course.subject === subject);
    } else if (number) {
      return this.courses.filter(course => course.number.startsWith(number));
    } else {
      return [];
    }
  }

  getCombinations(desiredCourses, pinnedCrns, excludedCrns) {
    const crnsList = [];
    const dfs = (courseIndex = 0, crns = []) => {
      if (courseIndex === desiredCourses.length) {
        crnsList.push(crns);
        return;
      }
      const course = this.findCourse(desiredCourses[courseIndex]);
      const isIncluded = section => !excludedCrns.includes(section.crn);
      const isPinned = section => pinnedCrns.includes(section.crn);
      const hasConflict = section => [...pinnedCrns, ...crns].some(crn => hasConflictBetween(this.findSection(crn), section));
      if (course.hasLab) {
        const pinnedLectures = course.lectures.filter(isPinned);
        const pinnedLabs = course.labs.filter(isPinned);
        if (pinnedLabs.length) {
          pinnedLabs.forEach(lab => {
            lab.lectures.filter(isIncluded).forEach(lecture => {
              if (isPinned(lecture)) {
                dfs(courseIndex + 1, crns);
              } else {
                if (hasConflict(lecture)) return;
                dfs(courseIndex + 1, [...crns, lecture.crn]);
              }
            });
          });
        } else if (pinnedLectures.length) {
          pinnedLectures.forEach(lecture => {
            lecture.labs.filter(isIncluded).forEach(lab => {
              if (hasConflict(lab)) return;
              dfs(courseIndex + 1, [...crns, lab.crn]);
            });
          });
        } else {
          course.lectures.filter(isIncluded).forEach(lecture => {
            if (hasConflict(lecture)) return;
            lecture.labs.filter(isIncluded).forEach(lab => {
              if (hasConflict(lab)) return;
              dfs(courseIndex + 1, [...crns, lecture.crn, lab.crn]);
            });
          });
        }
      } else {
        const sections = Object.values(course.sections);
        if (sections.some(isPinned)) {
          dfs(courseIndex + 1, crns);
        } else {
          Object.values(course.sectionGroups).forEach(sectionGroup => {
            const section = sectionGroup.sections.find(isIncluded);
            if (!section || hasConflict(section)) return;
            dfs(courseIndex + 1, [...crns, section.crn]);
          });
        }
      }
    };
    dfs();
    return crnsList.map(crns => {
      const startMap = {};
      const endMap = {};
      this.iterateTimeBlocks([...pinnedCrns, ...crns], (day, period) => {
        if (!(day in startMap) || startMap[day] > period.start) startMap[day] = period.start;
        if (!(day in endMap) || endMap[day] < period.end) endMap[day] = period.end;
      });
      return {
        crns,
        startMap,
        endMap,
      }
    });
  }

  iterateTimeBlocks(crns, callback) {
    crns.forEach(crn => {
      this.findSection(crn).meetings.forEach(meeting => meeting.period && (
        meeting.days.forEach(day => {
          callback(day, meeting.period);
        })
      ));
    });
  }
}

export default Oscar;
