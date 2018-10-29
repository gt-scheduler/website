import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import CopyToClipboard from 'react-copy-to-clipboard';
import domtoimage from 'dom-to-image';
import saveAs from 'file-saver';
import { classes, getRandomColor, isMobile, stringToTime } from '../../utils';
import { PNG_SCALE_FACTOR } from '../../constants';
import { Calendar, Combinations, Course, CourseAdd, SemiPureComponent } from '../';
import { actions } from '../../reducers';
import './stylesheet.scss';

class App extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      overlayCrns: [],
      loaded: false,
      tabIndex: 0,
    };

    this.captureRef = React.createRef();

    this.handleResize = this.handleResize.bind(this);
    this.handleSetOverlayCrns = this.handleSetOverlayCrns.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
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

    axios.get('https://jasonpark.me/gt-schedule-crawler/courses.json')
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
          const lectures = sections.filter(section => section.credits > 0);
          const labs = sections.filter(section => section.credits === 0);
          course.hasLab = !course.id.startsWith('VIP') && lectures.length && labs.length;
          if (course.hasLab) {
            course.lectures = lectures;
            course.labs = labs;
            course.lectures.forEach(lecture => lecture.labs = course.labs.filter(lab => lab.id.startsWith(lecture.id)));
            course.labs.forEach(lab => lab.lectures = course.lectures.filter(lecture => lab.id.startsWith(lecture.id)));
            if (course.lectures.every(lecture => !lecture.labs.length)) {
              course.lectures.forEach(lecture => lecture.labs = course.labs);
              course.labs.forEach(lab => lab.lectures = course.lectures);
            }
          } else {
            course.sectionGroups = distinct(sections);
          }
        });

        this.props.setCourses(courses);
        this.props.setCrns(crns);
        this.setState({ loaded: true });
      });

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  getTotalCredits() {
    const { crns } = this.props.oscar;
    const { pinnedCrns } = this.props.user;
    return pinnedCrns.reduce((credits, crn) => credits + crns[crn].credits, 0);
  }

  handleResize(e) {
    const { mobile } = this.props.env;
    const nextMobile = isMobile();
    if (mobile !== nextMobile) {
      this.props.setMobile(nextMobile);
    }
  }

  handleSetPinnedCrns(pinnedCrns) {
    this.props.setPinnedCrns(pinnedCrns);
  }

  handleSetOverlayCrns(overlayCrns) {
    this.setState({ overlayCrns });
  }

  handleDownload() {
    const { current } = this.captureRef;
    domtoimage.toPng(current, {
      width: current.offsetWidth * PNG_SCALE_FACTOR,
      height: current.offsetHeight * PNG_SCALE_FACTOR,
      style: {
        'left': 0,
        'transform': `scale(${PNG_SCALE_FACTOR})`,
        'transform-origin': 'top left',
      },
    }).then(blob => saveAs(blob, 'schedule.png'));
  }

  handleChangeTab(tabIndex) {
    this.setState({ tabIndex });
  }

  render() {
    const { mobile } = this.props.env;
    const { courses } = this.props.oscar;
    const { pinnedCrns, desiredCourses } = this.props.user;
    const { overlayCrns, loaded, tabIndex } = this.state;

    return loaded && (
      <div className={classes('App', mobile && 'mobile')}>
        {
          !mobile &&
          <div className="calendar-container">
            <Calendar overlayCrns={overlayCrns}/>
          </div>
        }
        <div className="capture-container" ref={this.captureRef}>
          <Calendar className="fake-calendar"/>
        </div>
        <div className="sidebar">
          {
            mobile &&
            <div className="tab-container">
              {
                ['Courses', 'Combinations', 'Calendar'].map((tabTitle, i) => (
                  <div className={classes('tab', tabIndex === i && 'active')} onClick={() => this.handleChangeTab(i)}
                       key={i}>
                    {tabTitle}
                  </div>
                ))
              }
            </div>
          }
          <div className="title">
            <span className="primary">Spring 2019</span>
            <span className="secondary">
              {this.getTotalCredits()} Credits
            </span>
          </div>
          <div className="scroller">
            <div className={classes('courses-container', tabIndex === 0 && 'active')}>
              {
                pinnedCrns.length > 0 &&
                <CopyToClipboard className="button" text={pinnedCrns.join(', ')}>
                  <span>{pinnedCrns.join(', ')}</span>
                </CopyToClipboard>
              }
              <div className="course-list">
                {
                  desiredCourses.map(courseId => {
                    const course = courses[courseId];
                    return (
                      <Course courseId={courseId} expandable key={course.id} onSetOverlayCrns={this.handleSetOverlayCrns}/>
                    );
                  })
                }
              </div>
              <CourseAdd/>
            </div>
            <div className={classes('combinations-container', tabIndex === 1 && 'active')}>
              {
                pinnedCrns.length > 0 &&
                <div className="button" onClick={() => this.handleSetPinnedCrns([])}>
                  Reset Sections
                </div>
              }
              <Combinations className="combinations" onSetOverlayCrns={this.handleSetOverlayCrns}/>
            </div>
            {
              mobile &&
              <div className={classes('calendar-container', tabIndex === 2 && 'active')}>
                <Calendar overlayCrns={overlayCrns}/>
              </div>
            }
          </div>
          <div className="button" onClick={this.handleDownload}>
            Download as PNG
          </div>
          <a className="button" href="https://github.com/parkjs814/gt-scheduler" rel="noopener noreferrer"
             target="_blank">
            Fork me on GitHub
          </a>
        </div>
      </div>
    );
  }
}

export default connect(({ env, oscar, user }) => ({ env, oscar, user }), actions)(App);
