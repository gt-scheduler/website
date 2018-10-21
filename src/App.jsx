import React, { Component } from 'react';
import axios from 'axios';
import './App.scss';
import { getRandomColor, hasTimeConflict, stringToTime } from './util';
import Course from './Course';
import Calendar from './Calendar';
import Cookies from 'js-cookie';

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
  }

  componentDidMount() {
    axios.get(`./courses.json`)
      .then(res => {
        const crns = {};
        const courses = res.data;
        Object.keys(courses).forEach(courseId => {
          const course = courses[courseId];
          course.id = courseId;
          course.color = getRandomColor(32, 160);
          course.sectionGroups = {};
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
            const sectionGroupMeetings = section.meetings.map(({ days, period }) => ({ days, period }));
            const sectionGroupHash = JSON.stringify(sectionGroupMeetings);
            const sectionGroup = course.sectionGroups[sectionGroupHash];
            if (sectionGroup) {
              sectionGroup.sections.push(section);
            } else {
              course.sectionGroups[sectionGroupHash] = {
                hash: sectionGroupHash,
                meetings: sectionGroupMeetings,
                sections: [section],
              };
            }
          });
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
          if (combination.length) combinations.push(combination);
          return;
        }
        const course = this.courses[desiredCourses[courseIndex]];
        if (Object.values(course.sections).some(section => pinnedCrns.includes(section.crn))) {
          dfs(courseIndex + 1, combination);
          return;
        }
        Object.values(course.sectionGroups).forEach(sectionGroup => {
          const section = sectionGroup.sections.find(section => !excludedCrns.includes(section.crn));
          if (!section) return;
          const timeConflict = [...pinnedCrns, ...combination].map(crn => this.crns[crn]).some(pinnedSection => hasTimeConflict(pinnedSection, section));
          if (timeConflict) return;
          dfs(courseIndex + 1, [...combination, section.crn]);
        });
      };
      dfs();
      return { ...update, combinations };
    });
  }

  handleRemoveCourse(course) {
    this.updateCombinations(state => {
      const pinnedCrns = state.pinnedCrns.filter(crn => !Object.values(course.sections).some(section => section.crn === crn));
      const desiredCourses = state.desiredCourses.filter(courseId => courseId !== course.id);
      return { pinnedCrns, desiredCourses };
    });
  }

  handleAddCourse(course) {
    this.updateCombinations(state => {
      const { desiredCourses } = state;
      if (!desiredCourses.includes(course.id)) {
        return { keyword: '', desiredCourses: [...desiredCourses, course.id] };
      }
      return { keyword: '' };
    });
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

  handleSetPinnedCrns(pinnedCrns) {
    this.updateCombinations({ pinnedCrns });
  }

  handleSetOverlayCrns(overlayCrns) {
    //if (JSON.stringify(overlayCrns) === JSON.stringify(this.state.overlayCrns)) return;//
    this.setState({ overlayCrns });
  }

  render() {
    console.log('render');
    const { pinnedCrns, excludedCrns, desiredCourses, combinations, overlayCrns, keyword, loaded } = this.state;

    return loaded && (
      <div className="App">
        <div className="container">
          <Calendar pinnedCrns={pinnedCrns} overlayCrns={overlayCrns} crns={this.crns}/>
        </div>
        <div className="sidebar">
          <div className="title">
            Spring 2019
          </div>
          {
            desiredCourses.map(courseId => {
              const course = this.courses[courseId];
              return (
                <Course course={course} expandable key={course.id}
                        onRemove={course => this.handleRemoveCourse(course)}
                        onTogglePinned={course => this.handleTogglePinned(course)}
                        onToggleExcluded={course => this.handleToggleExcluded(course)}
                        onSetOverlayCrns={overlayCrns => this.handleSetOverlayCrns(overlayCrns)}
                        pinnedCrns={pinnedCrns}
                        excludedCrns={excludedCrns}/>
              );
            })
          }
          <div className="course-add">
            <input type="text" value={keyword} onChange={e => this.handleChangeKeyword(e)} className="keyword"
                   placeholder="XX 0000"/>
            <div className="courses">
              {
                keyword &&
                Object.values(this.courses).filter(course => course.id.startsWith(keyword.toUpperCase())).slice(0, 10).map(course => (
                  <Course course={course} onClick={() => this.handleAddCourse(course)} key={course.id}
                          pinnedCrns={pinnedCrns}/>
                ))
              }
            </div>
          </div>
          <div className="title">
            Auto Select
          </div>
          <div className="combinations">
            {
              combinations.map((combination, i) => (
                <div className="combination"
                     onMouseEnter={() => this.handleSetOverlayCrns(combination)}
                     onMouseLeave={() => this.handleSetOverlayCrns([])}
                     onClick={() => this.handleSetPinnedCrns([...pinnedCrns, ...combination])}>
                  <div className="number">{i + 1}</div>
                  <Calendar className="preview" pinnedCrns={[...pinnedCrns, ...combination]} overlayCrns={[]}
                            crns={this.crns} key={i} preview/>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}


export default App;
