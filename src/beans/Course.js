import { Section } from './';
import { hasConflictBetween, isLab, isLecture } from '../utils';

class Course {
  constructor(oscar, courseId, data) {
    const [title, sections] = data;

    this.id = courseId;
    [this.subject, this.number] = this.id.split(' ');
    this.title = title;
    this.sections = Object.keys(sections).map(
      (sectionId) => new Section(oscar, this, sectionId, sections[sectionId])
    );

    //this.gpa = this.fetchGpa(courseId);

    const onlyLectures = this.sections.filter(
      (section) => isLecture(section) && !isLab(section)
    );
    const onlyLabs = this.sections.filter(
      (section) => isLab(section) && !isLecture(section)
    );
    this.hasLab = onlyLectures.length && onlyLabs.length;
    if (this.hasLab) {
      onlyLectures.forEach(
        (lecture) =>
          (lecture.associatedLabs = onlyLabs.filter((lab) =>
            lab.id.startsWith(lecture.id)
          ))
      );
      onlyLabs.forEach(
        (lab) =>
          (lab.associatedLectures = onlyLectures.filter((lecture) =>
            lab.id.startsWith(lecture.id)
          ))
      );
      const lonelyLectures = onlyLectures.filter(
        (lecture) => !lecture.associatedLabs.length
      );
      const lonelyLabs = onlyLabs.filter(
        (lab) => !lab.associatedLectures.length
      );
      lonelyLectures.forEach(
        (lecture) =>
          (lecture.associatedLabs = lonelyLabs.filter(
            (lab) => !hasConflictBetween(lecture, lab)
          ))
      );
      lonelyLabs.forEach(
        (lab) =>
          (lab.associatedLectures = lonelyLectures.filter(
            (lecture) => !hasConflictBetween(lecture, lab)
          ))
      );
      this.onlyLectures = onlyLectures;
      this.onlyLabs = onlyLabs;
      this.allInOnes = this.sections.filter(
        (section) => isLecture(section) && isLab(section)
      );
    } else {
      this.sectionGroups = this.distinct(this.sections);
    }
  }

  distinct(sections) {
    let groups = {};
    sections.forEach((section) => {
      const sectionGroupMeetings = section.meetings.map(({ days, period }) => ({
        days,
        period,
      }));
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
}

export default Course;
