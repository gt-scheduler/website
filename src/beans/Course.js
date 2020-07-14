import { Section } from './';
import { hasConflictBetween, isLab, isLecture } from '../utils';
import axios from 'axios';
import cheerio from 'cheerio';

class Course {
  constructor(oscar, courseId, data) {
    const [title, sections] = data;

    this.id = courseId;
    [this.subject, this.number] = this.id.split(' ');
    this.title = title;
    this.sections = Object.keys(sections).map(
      (sectionId) => new Section(oscar, this, sectionId, sections[sectionId]),
    );

    const onlyLectures = this.sections.filter(
      (section) => isLecture(section) && !isLab(section),
    );
    const onlyLabs = this.sections.filter(
      (section) => isLab(section) && !isLecture(section),
    );
    this.hasLab = onlyLectures.length && onlyLabs.length;
    if (this.hasLab) {
      onlyLectures.forEach(
        (lecture) =>
          (lecture.associatedLabs = onlyLabs.filter((lab) =>
            lab.id.startsWith(lecture.id),
          )),
      );
      onlyLabs.forEach(
        (lab) =>
          (lab.associatedLectures = onlyLectures.filter((lecture) =>
            lab.id.startsWith(lecture.id),
          )),
      );
      const lonelyLectures = onlyLectures.filter(
        (lecture) => !lecture.associatedLabs.length,
      );
      const lonelyLabs = onlyLabs.filter(
        (lab) => !lab.associatedLectures.length,
      );
      lonelyLectures.forEach(
        (lecture) =>
          (lecture.associatedLabs = lonelyLabs.filter(
            (lab) => !hasConflictBetween(lecture, lab),
          )),
      );
      lonelyLabs.forEach(
        (lab) =>
          (lab.associatedLectures = lonelyLectures.filter(
            (lecture) => !hasConflictBetween(lecture, lab),
          )),
      );
      this.onlyLectures = onlyLectures;
      this.onlyLabs = onlyLabs;
      this.allInOnes = this.sections.filter(
        (section) => isLecture(section) && isLab(section),
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

  async fetchCourseCritique() {
    let courseString = this.id.replace(' ', '%20');
    return await axios({
      url: `https://cors-anywhere.herokuapp.com/http://critique.gatech.edu/course.php?id=${courseString}`,
      method: 'get',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'text/html',
      },
    })
      .then((response) => response.data)
      .then(this.handleParse)
      .then(res => {
        return res;
      });
  };

  handleParse(res) {
    const $ = cheerio.load(res);
    let info = {
      avgGpa: Number(
        $('div.center-table > table.table > tbody > tr :nth-child(2)', res).text(),
      ),
      a: Number(
        $('div.center-table > table.table > tbody > tr :nth-child(3)', res).text(),
      ),
      b: Number(
        $('div.center-table > table.table > tbody > tr :nth-child(4)', res).text(),
      ),
      c: Number(
        $('div.center-table > table.table > tbody > tr :nth-child(5)', res).text(),
      ),
      d: Number(
        $('div.center-table > table.table > tbody > tr :nth-child(6)', res).text(),
      ),
      f: Number(
        $('div.center-table > table.table > tbody > tr :nth-child(7)', res).text(),
      ),
      instructors: [],
    };

    $('table#dataTable > tbody > tr', res).each((i, element) => {
      let item = {
        profName: $(element).find('td:nth-child(1)').text(),
        classSize: $(element).find('td:nth-child(2)').text(),
        avgGpa: $(element).find('td:nth-child(3)').text(),
        a: $(element).find('td:nth-child(4)').text(),
        b: $(element).find('td:nth-child(5)').text(),
        c: $(element).find('td:nth-child(6)').text(),
        d: $(element).find('td:nth-child(7)').text(),
        f: $(element).find('td:nth-child(8)').text(),
        w: $(element).find('td:nth-child(9)').text(),
      };
      let newArr = info.instructors;
      newArr.push(item);
      info.instructors = newArr;
    });

    return info;
  };
}

export default Course;
