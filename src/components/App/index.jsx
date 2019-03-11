import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import domtoimage from 'dom-to-image';
import saveAs from 'file-saver';
import ics from '../../libs/ics';
import { classes, isMobile } from '../../utils';
import { PNG_SCALE_FACTOR } from '../../constants';
import { Button, Calendar, CombinationsContainer, Course, CourseAdd, SemiPureComponent } from '../';
import { actions } from '../../reducers';
import { Oscar } from '../../beans';
import './stylesheet.scss';

class App extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      terms: [],
      overlayCrns: [],
      tabIndex: 0,
    };

    this.captureRef = React.createRef();

    this.handleResize = this.handleResize.bind(this);
    this.handleSetOverlayCrns = this.handleSetOverlayCrns.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
  }

  componentDidMount() {
    const { term } = this.props.user;
    if (term) this.loadOscar(term);
    axios.get('https://jasonpark.me/gt-schedule-crawler/term_ins.json')
      .then(res => {
        const terms = res.data.reverse();
        if (!term) {
          const recentTerm = terms[0];
          this.props.setTerm(recentTerm);
          this.loadOscar(recentTerm);
        }
        this.setState({ terms });
      });

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  loadOscar(term) {
    axios.get(`https://jasonpark.me/gt-schedule-crawler/${term}.json`)
      .then(res => {
        const oscar = new Oscar(res.data);
        this.props.setOscar(oscar);
      });
  }

  getTotalCredits() {
    const { oscar } = this.props.db;
    const { pinnedCrns } = this.props.user;
    return pinnedCrns.reduce((credits, crn) => credits + oscar.findSection(crn).credits, 0);
  }

  handleResize(e) {
    const { mobile } = this.props.env;
    const nextMobile = isMobile();
    if (mobile !== nextMobile) {
      this.props.setMobile(nextMobile);
    }
  }

  handleSetOverlayCrns(overlayCrns) {
    this.setState({ overlayCrns });
  }

  handleExport() {
    const { oscar } = this.props.db;
    const { pinnedCrns } = this.props.user;
    const cal = ics();
    const range = {
      from: new Date('Jan 07, 2019'), // TODO: parse the date ranges of semesters
      to: new Date('May 02, 2019'),
    };
    range.from.setHours(0);
    range.to.setHours(23, 59, 59, 999);
    pinnedCrns.forEach(crn => {
      const section = oscar.findSection(crn);
      section.meetings.forEach(meeting => {
        if (!meeting.period || !meeting.days.length) return;
        const subject = section.course.id;
        const description = section.course.title;
        const location = meeting.where;
        const begin = new Date(range.from);
        while (!meeting.days.includes(['-', 'M', 'T', 'W', 'R', 'F', '-'][begin.getDay()])) {
          begin.setDate(begin.getDate() + 1);
        }
        begin.setHours(meeting.period.start / 60 | 0, meeting.period.start % 60);
        const end = new Date(begin);
        end.setHours(meeting.period.end / 60 | 0, meeting.period.end % 60);
        const rrule = {
          freq: 'WEEKLY',
          until: range.to,
          byday: meeting.days.map(day => ({ M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR' }[day])),
        };
        cal.addEvent(subject, description, location, begin, end, rrule);
      });
    });
    cal.download('gt-scheduler');
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

  handleChangeSemester = e => {
    const term = e.target.value;
    this.props.setTerm(term);
  };

  render() {
    const { mobile } = this.props.env;
    const { oscar } = this.props.db;
    const { term, pinnedCrns, desiredCourses } = this.props.user;
    const { terms, overlayCrns, tabIndex } = this.state;

    return oscar && (
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
            <select className="primary" onChange={this.handleChangeSemester} value={term}>
              {
                terms.map(term => {
                  const year = term.substring(0, 4);
                  const semester = { '02': 'Spring', '05': 'Summer', '08': 'Fall' }[term.substring(4)];
                  return (
                    <option key={term} value={term}>{semester} {year}</option>
                  );
                })
              }
            </select>
            <span className="secondary">
              {this.getTotalCredits()} Credits
            </span>
          </div>
          <div className="scroller">
            <div className={classes('courses-container', tabIndex === 0 && 'active')}>
              <div className="course-list">
                {
                  desiredCourses.map(courseId => {
                    return (
                      <Course courseId={courseId} expandable key={courseId}
                              onSetOverlayCrns={this.handleSetOverlayCrns}/>
                    );
                  })
                }
              </div>
              <CourseAdd/>
            </div>
            <CombinationsContainer className={classes('combinations-container', tabIndex === 1 && 'active')}
                                   onSetOverlayCrns={this.handleSetOverlayCrns}/>
            {
              mobile &&
              <div className={classes('calendar-container', tabIndex === 2 && 'active')}>
                <Calendar overlayCrns={overlayCrns}/>
              </div>
            }
          </div>
          {
            pinnedCrns.length > 0 &&
            <Button text={pinnedCrns.join(', ')}>
              <span>Copy CRNs</span>
            </Button>
          }
          <Button onClick={this.handleExport}>
            Export Calendar
          </Button>
          <Button onClick={this.handleDownload}>
            Download as PNG
          </Button>
          <Button href="https://github.com/parkjs814/gt-scheduler">
            Fork me on GitHub
          </Button>
        </div>
      </div>
    );
  }
}

export default connect(({ env, db, user }) => ({ env, db, user }), actions)(App);
