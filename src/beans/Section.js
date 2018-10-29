import { stringToTime } from '../utils';

class Section {
  constructor(course, sectionId, data) {
    this.course = course;
    this.id = sectionId;
    this.crn = data.crn;
    this.credits = data.credits;
    this.meetings = data.meetings.map(({ days, period, instructors, where }) => ({
      days: days === '&nbsp;' ? [] : [...days],
      period: period === 'TBA' ? undefined : {
        start: stringToTime(period.split(' - ')[0]),
        end: stringToTime(period.split(' - ')[1]),
      },
      instructors,
      where,
    }));
    this.instructors = [...new Set(this.meetings.reduce((instructors, meeting) => [...instructors, ...meeting.instructors], []))];
  }
}

export default Section;
