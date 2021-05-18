import axios from 'axios';
import { Section } from '.';
import { hasConflictBetween, isLab, isLecture } from '../utils';

class Course {
  constructor(oscar, courseId, data) {
    const [title, sections, prereqs] = data;

    this.id = courseId;
    [this.subject, this.number] = this.id.split(' ');
    this.title = title;
    this.sections = Object.keys(sections).map(
      (sectionId) => new Section(oscar, this, sectionId, sections[sectionId])
    );
    this.prereqs = prereqs;

    const onlyLectures = this.sections.filter(
      (section) => isLecture(section) && !isLab(section)
    );
    const onlyLabs = this.sections.filter(
      (section) => isLab(section) && !isLecture(section)
    );
    this.hasLab = onlyLectures.length && onlyLabs.length;
    if (this.hasLab) {
      for (const lecture of onlyLectures) {
        lecture.associatedLabs = onlyLabs.filter(
          (lab) =>
            // note: checking both ways because gech registrar
            // reversed studio and lecture sections for MATH 1553
            lecture.id.startsWith(lab.id) || lab.id.startsWith(lecture.id)
        );
        // if no matching section id letters found, match by profs
        if (!lecture.associatedLabs.length) {
          // match lecture and lab sections if there are *any* matching instructors
          // fixes issue with PHYS 2211 and 2212 no longer matching section id letters
          lecture.associatedLabs = onlyLabs.filter(
            (lab) =>
              lab.instructors.filter((instructor) =>
                lecture.instructors.includes(instructor)
              ).length
          );
        }
      }
      for (const lab of onlyLabs) {
        // note: now that the lab/lecture matching is symmetric
        // we have duplicated code
        lab.associatedLectures = onlyLectures.filter(
          (lecture) =>
            lab.id.startsWith(lecture.id) || lecture.id.startsWith(lab.id)
        );
        if (!lab.associatedLectures.length) {
          lab.associatedLectures = onlyLectures.filter(
            (lecture) =>
              lab.instructors.filter((instructor) =>
                lecture.instructors.includes(instructor)
              ).length
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

  distinct(sections) {
    const groups = {};
    sections.forEach((section) => {
      const sectionGroupMeetings = section.meetings.map(({ days, period }) => ({
        days,
        period
      }));
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

  async fetchGpa() {
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
        const gpaMap = { averageGpa };

        data.raw.forEach((datum) => {
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
