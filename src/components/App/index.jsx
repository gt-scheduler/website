import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import domtoimage from 'dom-to-image';
import saveAs from 'file-saver';
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
      overlayCrns: [],
      tabIndex: 0,
    };

    this.captureRef = React.createRef();

    this.handleResize = this.handleResize.bind(this);
    this.handleSetOverlayCrns = this.handleSetOverlayCrns.bind(this);
    this.handleDownload = this.handleDownload.bind(this);
  }

  componentDidMount() {
    axios.get('https://jasonpark.me/gt-schedule-crawler/courses.json')
      .then(res => {
        const oscar = new Oscar(res.data);
        this.props.setOscar(oscar);
      });

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
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
    const { oscar } = this.props.db;
    const { pinnedCrns, desiredCourses } = this.props.user;
    const { overlayCrns, tabIndex } = this.state;

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
            <span className="primary">Spring 2019</span>
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
