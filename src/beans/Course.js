import { Section } from './';

class Course {
  constructor(oscar, courseId, data) {
    const [title, sections] = data;

    this.id = courseId;
    [this.subject, this.number] = this.id.split(' ');
    this.title = title;
    this.sections = Object.keys(sections).map(sectionId => new Section(oscar, this, sectionId, sections[sectionId]));

    const lectures = this.sections.filter(section => section.credits > 0);
    const labs = this.sections.filter(section => section.credits === 0);
    this.hasLab = !this.id.startsWith('VIP') && lectures.length && labs.length;
    if (this.hasLab) {
      this.lectures = lectures;
      this.labs = labs;
      this.lectures.forEach(lecture => lecture.labs = this.labs.filter(lab => lab.id.startsWith(lecture.id)));
      this.labs.forEach(lab => lab.lectures = this.lectures.filter(lecture => lab.id.startsWith(lecture.id)));
      if (this.lectures.every(lecture => !lecture.labs.length)) {
        this.lectures.forEach(lecture => lecture.labs = this.labs);
        this.labs.forEach(lab => lab.lectures = this.lectures);
      }
    } else {
      this.sectionGroups = this.distinct(this.sections);
    }
  }

  distinct(sections) {
    let groups = {};
    sections.forEach(section => {
      const sectionGroupMeetings = section.meetings.map(({ days, period }) => ({ days, period }));
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
  };
}

export default Course;
