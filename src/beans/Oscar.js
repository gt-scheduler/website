import { Course } from './';

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
}

export default Oscar;
