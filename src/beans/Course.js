import axios from 'axios';
import cheerio from 'cheerio';
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
        lecture.associatedLabs = onlyLabs.filter((lab) =>
          lab.id.startsWith(lecture.id)
        );
      }
      for (const lab of onlyLabs) {
        lab.associatedLectures = onlyLectures.filter((lecture) =>
          lab.id.startsWith(lecture.id)
        );
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
    const url = `https://critique.gatech.edu/course?id=${encodeURIComponent(
      this.id
    )}`;
    return axios({
      url: `https://cors-anywhere.herokuapp.com/${url}`,
      method: 'get',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'text/html'
      }
    }).then((response) => {
      const $ = cheerio.load(response.data);
      const averageGpa = Number(
        $('div.center-table > table.table > tbody > tr :nth-child(2)').text()
      );
      const gpaMap = { averageGpa };

      $('table#dataTable > tbody > tr').each((i, element) => {
        const instructor = $(element).find('td:nth-child(1)').text();
        const [lastName, firstName] = instructor.split(', ');
        const fullName = `${firstName} ${lastName}`;
        gpaMap[fullName] = Number($(element).find('td:nth-child(3)').text());
      });

      return gpaMap;
    });
  }
}

export default Course;
