import React, { Component } from 'react';
import axios from 'axios';
import './App.scss';
import { getRandomColor, hasConflictBetween, stringToTime } from './util';
import Course from './Course';
import Calendar from './Calendar';
import Cookies from 'js-cookie';
import { TYPE_LAB, TYPE_LECTURE } from './config';
import Combinations from './Combinations';

class App extends Component {
  constructor(props) {
    super(props);

    this.courses = {};
    this.crns = {};

    this.state = {
      ...this.loadData(),
      combinations: [],
      overlayCrns: [],
      keyword: '',
      loaded: false,
    };

    this.inputRef = React.createRef();

    this.handleSetPinnedCrns = this.handleSetPinnedCrns.bind(this);
    this.handleSetOverlayCrns = this.handleSetOverlayCrns.bind(this);
    this.handleAddCourse = this.handleAddCourse.bind(this);
    this.handleChangeKeyword = this.handleChangeKeyword.bind(this);
    this.handlePressEnter = this.handlePressEnter.bind(this);
    this.handleRemoveCourse = this.handleRemoveCourse.bind(this);
    this.handleToggleExcluded = this.handleToggleExcluded.bind(this);
    this.handleTogglePinned = this.handleTogglePinned.bind(this);
  }

  componentDidMount() {
    const distinct = sections => {
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

    axios.get(`./courses.json`)
      .then(res => {
        const crns = {};
        const courses = res.data;
        Object.keys(courses).forEach(courseId => {
          const course = courses[courseId];
          course.id = courseId;
          course.color = getRandomColor(32, 160);
          Object.keys(course.sections).forEach(sectionId => {
            const section = course.sections[sectionId];
            section.id = sectionId;
            section.course = course;
            const instructors = [];
            section.meetings.forEach(meeting => instructors.push(...meeting.instructors));
            section.instructors = [...new Set(instructors)];
            crns[section.crn] = section;
            section.meetings.forEach(meeting => {
              meeting.course = course;
              meeting.section = section;
              const { days, period } = meeting;
              if (days === '&nbsp;') {
                meeting.days = [];
              } else {
                meeting.days = [...days];
              }
              if (period === 'TBA') {
                meeting.period = undefined;
              } else {
                const [start, end] = period.split(' - ');
                meeting.period = {
                  start: stringToTime(start),
                  end: stringToTime(end),
                };
              }
            });
          });
          const sections = Object.values(course.sections);
          const scheduleTypes = sections.map(section => section.scheduleType);
          course.hasLab = scheduleTypes.includes(TYPE_LECTURE) && scheduleTypes.includes(TYPE_LAB);
          if (course.hasLab) {
            course.lectures = sections.filter(section => section.scheduleType === TYPE_LECTURE);
            course.labs = sections.filter(section => section.scheduleType === TYPE_LAB);
            course.lectures.forEach(lecture => lecture.labs = course.labs.filter(lab => lab.id.startsWith(lecture.id)));
            course.labs.forEach(lab => lab.lecture = course.lectures.find(lecture => lab.id.startsWith(lecture.id)));
          } else {
            course.sectionGroups = distinct(sections);
          }
        });

        this.courses = courses;
        this.crns = crns;
        this.updateCombinations({ loaded: true });
      });
  }

  saveData({ desiredCourses = [], pinnedCrns = [], excludedCrns = [] }) {
    Cookies.set('data', JSON.stringify({ desiredCourses, pinnedCrns, excludedCrns }));
  }

  loadData() {
    let json = null;
    try {
      json = JSON.parse(Cookies.get('data'));
    } catch (e) {
      json = {};
    }
    const { desiredCourses = [], pinnedCrns = [], excludedCrns = [] } = json;
    return { desiredCourses, pinnedCrns, excludedCrns };
  }

  updateCombinations(dispatch) {
    this.setState(state => {
      const update = typeof dispatch === 'function' ? dispatch(state) : dispatch;
      const updatedState = { ...state, ...update };
      const { desiredCourses, pinnedCrns, excludedCrns } = updatedState;
      this.saveData(updatedState);
      const combinations = [];
      const dfs = (courseIndex = 0, combination = []) => {
        if (courseIndex === desiredCourses.length) {
          combinations.push(combination);
          return;
        }
        const course = this.courses[desiredCourses[courseIndex]];
        const isIncluded = section => !excludedCrns.includes(section.crn);
        const isPinned = section => pinnedCrns.includes(section.crn);
        const hasConflict = section => [...pinnedCrns, ...combination].some(crn => hasConflictBetween(this.crns[crn], section));
        if (course.hasLab) {
          const pinnedLectures = course.lectures.filter(isPinned);
          const pinnedLabs = course.labs.filter(isPinned);
          if (pinnedLabs.length) {
            pinnedLabs.forEach(lab => {
              const { lecture } = lab;
              if (!lecture) return;
              if (isPinned(lecture)) {
                dfs(courseIndex + 1, combination);
              } else {
                if (!isIncluded(lecture) || hasConflict(lecture)) return;
                dfs(courseIndex + 1, [...combination, lecture.crn]);
              }
            });
          } else if (pinnedLectures.length) {
            pinnedLectures.forEach(lecture => {
              lecture.labs.filter(isIncluded).forEach(lab => {
                if (hasConflict(lab)) return;
                dfs(courseIndex + 1, [...combination, lab.crn]);
              });
            });
          } else {
            course.lectures.filter(isIncluded).forEach(lecture => {
              if (hasConflict(lecture)) return;
              lecture.labs.filter(isIncluded).forEach(lab => {
                if (hasConflict(lab)) return;
                dfs(courseIndex + 1, [...combination, lecture.crn, lab.crn]);
              });
            });
          }
        } else {
          const sections = Object.values(course.sections);
          if (sections.some(isPinned)) {
            dfs(courseIndex + 1, combination);
          } else {
            Object.values(course.sectionGroups).forEach(sectionGroup => {
              const section = sectionGroup.sections.find(isIncluded);
              if (!section || hasConflict(section)) return;
              dfs(courseIndex + 1, [...combination, section.crn]);
            });
          }
        }
      };
      dfs();
      return { ...update, combinations };
    });
  }

  searchCourses(keyword) {
    return Object.values(this.courses).filter(course => course.id.startsWith(keyword.toUpperCase()));
  }

  handleRemoveCourse(course) {
    this.updateCombinations(state => {
      const desiredCourses = state.desiredCourses.filter(courseId => courseId !== course.id);
      const pinnedCrns = state.pinnedCrns.filter(crn => !Object.values(course.sections).some(section => section.crn === crn));
      const excludedCrns = state.excludedCrns.filter(crn => !Object.values(course.sections).some(section => section.crn === crn));
      return { desiredCourses, pinnedCrns, excludedCrns };
    });
  }

  handleAddCourse(course) {
    this.updateCombinations(state => {
      const { desiredCourses, excludedCrns } = state;
      if (!desiredCourses.includes(course.id)) {
        const tbaCrns = Object.values(course.sections)
          .filter(section => section.meetings.some(meeting => !meeting.days.length || !meeting.period))
          .map(section => section.crn);
        return {
          keyword: '',
          desiredCourses: [...desiredCourses, course.id],
          excludedCrns: [...excludedCrns, ...tbaCrns],
        };
      }
      return { keyword: '' };
    });
    this.inputRef.current.focus();
  }

  handleTogglePinned(section) {
    this.updateCombinations(state => {
      const { pinnedCrns, excludedCrns } = state;
      if (pinnedCrns.includes(section.crn)) {
        return { pinnedCrns: pinnedCrns.filter(crn => crn !== section.crn) };
      } else {
        return {
          pinnedCrns: [...pinnedCrns, section.crn],
          excludedCrns: excludedCrns.filter(crn => crn !== section.crn),
        };
      }
    });
  }

  handleToggleExcluded(section) {
    this.updateCombinations(state => {
      const { pinnedCrns, excludedCrns } = state;
      if (excludedCrns.includes(section.crn)) {
        return { excludedCrns: excludedCrns.filter(crn => crn !== section.crn) };
      } else {
        return {
          excludedCrns: [...excludedCrns, section.crn],
          pinnedCrns: pinnedCrns.filter(crn => crn !== section.crn),
        };
      }
    });
  }

  handleChangeKeyword(e) {
    const keyword = e.target.value;
    this.setState({ keyword });
  }

  handlePressEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const courses = this.searchCourses(this.state.keyword);
      if (courses.length) this.handleAddCourse(courses[0]);
    }
  }

  handleSetPinnedCrns(pinnedCrns) {
    this.updateCombinations({ pinnedCrns });
  }

  handleSetOverlayCrns(overlayCrns) {
    this.setState({ overlayCrns });
  }

  render() {
    const { pinnedCrns, excludedCrns, desiredCourses, combinations, overlayCrns, keyword, loaded } = this.state;

    return loaded && (
      <div className="App">
        <div className="container">
          <Calendar pinnedCrns={pinnedCrns} overlayCrns={overlayCrns} crns={this.crns}/>
        </div>
        <div className="sidebar">
          <div className="title">
            <span className="primary">Spring 2019</span>
            <span className="secondary">
              {pinnedCrns.reduce((credits, crn) => credits + this.crns[crn].credits, 0)} Credits
            </span>
          </div>
          {
            pinnedCrns.length > 0 &&
            <div className="crns">
              {pinnedCrns.join(', ')}
            </div>
          }
          {
            desiredCourses.map(courseId => {
              const course = this.courses[courseId];
              return (
                <Course course={course} expandable key={course.id}
                        onRemove={this.handleRemoveCourse}
                        onTogglePinned={this.handleTogglePinned}
                        onToggleExcluded={this.handleToggleExcluded}
                        onSetOverlayCrns={this.handleSetOverlayCrns}
                        pinnedCrns={pinnedCrns}
                        excludedCrns={excludedCrns}/>
              );
            })
          }
          <div className="course-add">
            <input type="text" ref={this.inputRef} value={keyword} onChange={this.handleChangeKeyword}
                   className="keyword"
                   placeholder="XX 0000" onKeyPress={this.handlePressEnter}/>
            <div className="courses">
              {
                keyword &&
                this.searchCourses(keyword).slice(0, 10).map(course => (
                  <Course course={course} onClick={() => this.handleAddCourse(course)} key={course.id}
                          pinnedCrns={pinnedCrns}/>
                ))
              }
            </div>
          </div>
          <div className="title">
            Auto Select
          </div>
          <div className="crns" onClick={() => this.handleSetPinnedCrns([])}>
            Reset Sections
          </div>
          <Combinations combinations={combinations} crns={this.crns} pinnedCrns={pinnedCrns}
                        onSetOverlayCrns={this.handleSetOverlayCrns}
                        onSetPinnedCrns={this.handleSetPinnedCrns}/>
        </div>
      </div>
    );
  }
}


export default App;
