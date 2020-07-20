import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import domtoimage from 'dom-to-image';
import saveAs from 'file-saver';
import memoizeOne from 'memoize-one';
import Cookies from 'js-cookie';
import { AutoSizer, List } from 'react-virtualized/dist/commonjs';
import ics from '../../libs/ics';
import { classes, getSemesterName, isMobile } from '../../utils';
import { PNG_SCALE_FACTOR } from '../../constants';
import { Button, Calendar, Course, CourseAdd, Select, SemiPureComponent } from '../';
import { actions } from '../../reducers';
import { Oscar } from '../../beans';
import ago from 's-ago';
import 'react-virtualized/styles.css';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons/faCalendarAlt';
import { faPaste } from '@fortawesome/free-solid-svg-icons/faPaste';
import { faAdjust } from '@fortawesome/free-solid-svg-icons/faAdjust';
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub';

class App extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      terms: [],
      tabIndex: 0,
      theme: Cookies.get('theme') === 'light' ? 'light' : 'dark',
    };

    this.captureRef = React.createRef();
  }

  componentDidMount() {
    const { term } = this.props.user;
    if (term) this.loadOscar(term);
    axios
      .get('https://jasonpark.me/gt-schedule-crawler/terms.json')
      .then((res) => {
        const terms = res.data.reverse();
        if (!term) {
          const recentTerm = terms[0];
          this.handleChangeSemester(recentTerm);
        }
        this.setState({ terms });
      });

    window.addEventListener('resize', this.handleResize);
  }

  handleThemeChange = () => {
    const theme = this.state.theme === 'light' ? 'dark' : 'light';
    Cookies.set('theme', theme);
    this.setState({
      theme,
    });
  };

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  loadOscar(term) {
    this.props.setOscar(null);
    axios
      .get(`https://jasonpark.me/gt-schedule-crawler/${term}.json`)
      .then((res) => {
        const oscar = new Oscar(res.data);
        this.memoizedGetCombinations = memoizeOne(
          oscar.getCombinations.bind(oscar),
        );
        this.memoizedSortCombinations = memoizeOne(
          oscar.sortCombinations.bind(oscar),
        );
        this.props.setOscar(oscar);
      });
  }

  getTotalCredits() {
    const { oscar } = this.props.db;
    const { pinnedCrns } = this.props.user;

    return pinnedCrns.reduce((credits, crn) => {
      return credits + oscar.findSection(crn).credits;
    }, 0);
  }

  handleResize = (e) => {
    const { mobile } = this.props.env;
    const nextMobile = isMobile();
    if (mobile !== nextMobile) {
      this.props.setMobile(nextMobile);
    }
  };

  handleExport = () => {
    const { oscar } = this.props.db;
    const { pinnedCrns } = this.props.user;
    const cal = ics();
    pinnedCrns.forEach((crn) => {
      const section = oscar.findSection(crn);
      section.meetings.forEach((meeting) => {
        if (!meeting.period || !meeting.days.length) return;
        const { from, to } = meeting.dateRange;
        const subject = section.course.id;
        const description = section.course.title;
        const location = meeting.where;
        const begin = new Date(from);
        while (
          !meeting.days.includes(
            ['-', 'M', 'T', 'W', 'R', 'F', '-'][begin.getDay()],
          )
          ) {
          begin.setDate(begin.getDate() + 1);
        }
        begin.setHours(
          (meeting.period.start / 60) | 0,
          meeting.period.start % 60,
        );
        const end = new Date(begin);
        end.setHours((meeting.period.end / 60) | 0, meeting.period.end % 60);
        const rrule = {
          freq: 'WEEKLY',
          until: to,
          byday: meeting.days.map(
            (day) => ({ M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR' }[day]),
          ),
        };
        cal.addEvent(subject, description, location, begin, end, rrule);
      });
    });
    cal.download('gt-scheduler');
  };

  handleDownload = () => {
    const { current } = this.captureRef;
    domtoimage
      .toPng(current, {
        width: current.offsetWidth * PNG_SCALE_FACTOR,
        height: current.offsetHeight * PNG_SCALE_FACTOR,
        style: {
          left: 0,
          transform: `scale(${PNG_SCALE_FACTOR})`,
          'transform-origin': 'top left',
        },
      })
      .then((blob) => saveAs(blob, 'schedule.png'));
  };

  handleChangeTab = (tabIndex) => {
    this.setState({ tabIndex });
  };

  handleChangeSemester = (term) => {
    this.props.setTerm(term);
    this.loadOscar(term);
  };

  handleSetPinnedCrns = (pinnedCrns) => {
    this.props.setPinnedCrns(pinnedCrns);
  };

  handleResetPinnedCrns = () => {
    if (window.confirm('Are you sure to reset sections you selected?')) {
      this.props.setPinnedCrns([]);
    }
  };

  handleChangeSortingOptionIndex = sortingOptionIndex => {
    this.props.setSortingOptionIndex(sortingOptionIndex);
  };

  render() {
    const {
      mobile,
      overlayCrns,
    } = this.props.env;
    const { oscar } = this.props.db;
    const {
      term,
      desiredCourses,
      pinnedCrns,
      excludedCrns,
      sortingOptionIndex,
    } = this.props.user;

    const { terms, tabIndex, theme } = this.state;

    const className = classes('App', mobile && 'mobile', theme);

    if (!oscar) return (
      <div className={className}/>
    );

    const combinations = this.memoizedGetCombinations(
      desiredCourses,
      pinnedCrns,
      excludedCrns,
    );
    const sortedCombinations = this.memoizedSortCombinations(
      combinations,
      sortingOptionIndex,
    );

    return (
      <div className={className}>
        <div className="navigation">
          <Button className="logo">
            <span className="gt">GT </span>
            <span className="scheduler">Scheduler</span>
          </Button>
          <Select onChange={term => this.handleChangeSemester(term)}
                  value={term}
                  options={terms.map(term => ({ value: term, label: getSemesterName(term) }))}
                  className="semester"/>
          <span className="credits">
            {this.getTotalCredits()} Credits
          </span>
          <div className="menu">
            <Button
              onClick={this.handleDownload}
              disabled={pinnedCrns.length === 0}>
              <FontAwesomeIcon className="icon" fixedWidth icon={faDownload}/>
              <div className="text">Download</div>
            </Button>
            <Button
              onClick={this.handleExport}
              disabled={pinnedCrns.length === 0}>
              <FontAwesomeIcon className="icon" fixedWidth icon={faCalendarAlt}/>
              <div className="text">Export</div>
            </Button>
            <Button
              text={pinnedCrns.join(', ')}
              disabled={pinnedCrns.length === 0}>
              <FontAwesomeIcon className="icon" fixedWidth icon={faPaste}/>
              <div className="text">CRNs</div>
            </Button>
            <Button
              onClick={this.handleThemeChange}>
              <FontAwesomeIcon className="icon" fixedWidth icon={faAdjust}/>
              <div className="text">Theme</div>
            </Button>
            <Button href="https://github.com/64json/gt-scheduler">
              <FontAwesomeIcon className="icon" fixedWidth icon={faGithub}/>
              <div className="text">GitHub</div>
            </Button>
          </div>
        </div>
        {
          mobile && (
            <div className="tab-container">
              {['Courses', 'Combinations', 'Calendar'].map((tabTitle, i) => (
                <Button key={tabTitle}
                        className={classes('tab', tabIndex === i && 'active')}
                        onClick={() => this.handleChangeTab(i)}>
                  {tabTitle}
                </Button>
              ))}
            </div>
          )
        }
        <div className="main">
          {
            (!mobile || tabIndex === 0) && (
              <div className="sidebar sidebar-courses">
                <div className="scroller">
                  <div className="course-list">
                    {
                      desiredCourses.map((courseId) => {
                        return (
                          <Course
                            courseId={courseId}
                            expandable
                            key={courseId}
                          />
                        );
                      })
                    }
                  </div>
                  <CourseAdd className="course-add"/>
                </div>
                <Button className="updated-at" href="https://github.com/64json/gt-schedule-crawler">
                  Course data fetched {ago(oscar.updatedAt)}
                </Button>
              </div>
            )
          }

          {
            (!mobile || tabIndex === 1) && (
              <div className="sidebar sidebar-combinations">
                <Select
                  onChange={this.handleChangeSortingOptionIndex}
                  value={sortingOptionIndex}
                  options={oscar.sortingOptions.map((sortingOption, i) => ({ value: i, label: sortingOption.label }))}/>
                <Button
                  className="reset"
                  onClick={this.handleResetPinnedCrns}
                  disabled={pinnedCrns.length === 0}>
                  Reset Sections
                </Button>
                <div className="scroller">
                  <AutoSizer>
                    {({ width, height }) => (
                      <List
                        width={width}
                        height={height}
                        rowCount={sortedCombinations.length}
                        rowHeight={108}
                        rowRenderer={({ index, key, style }) => {
                          const { crns } = sortedCombinations[index];
                          return (
                            <div className="list-item" style={style} key={key}>
                              <div className="combination"
                                   onMouseEnter={() => this.props.setOverlayCrns(crns)}
                                   onMouseLeave={() => this.props.setOverlayCrns([])}
                                   onClick={() =>
                                     this.handleSetPinnedCrns([
                                       ...pinnedCrns,
                                       ...crns,
                                     ])
                                   }>
                                <div className="number">{index + 1}</div>
                                <Calendar className="calendar-preview"
                                          overlayCrns={crns}
                                          preview/>
                              </div>
                            </div>
                          );
                        }}
                      />
                    )}
                  </AutoSizer>
                </div>
              </div>
            )
          }

          {
            (!mobile || tabIndex === 2) && (
              <div className="calendar-container">
                <Calendar className="calendar" overlayCrns={overlayCrns}/>
              </div>
            )
          }
        </div>
        <div className="capture-container" ref={this.captureRef}>
          <Calendar className="fake-calendar" capture/>
        </div>
      </div>
    );
  }
}

export default connect(
  ({ env, db, user }) => ({ env, db, user }),
  actions,
)(App);
