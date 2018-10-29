import React from 'react';
import { connect } from 'react-redux';
import { classes, periodToString } from '../../utils';
import { actions } from '../../reducers';
import { SemiPureComponent } from '../';
import './stylesheet.scss';

class Course extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
    };
  }

  handleRemoveCourse(course) {
    const { desiredCourses, pinnedCrns, excludedCrns } = this.props.user;
    this.props.setDesiredCourses(desiredCourses.filter(courseId => courseId !== course.id));
    this.props.setPinnedCrns(pinnedCrns.filter(crn => !Object.values(course.sections).some(section => section.crn === crn)));
    this.props.setExcludedCrns(excludedCrns.filter(crn => !Object.values(course.sections).some(section => section.crn === crn)));
  }

  handleTogglePinned(section) {
    const { pinnedCrns, excludedCrns } = this.props.user;
    if (pinnedCrns.includes(section.crn)) {
      this.props.setPinnedCrns(pinnedCrns.filter(crn => crn !== section.crn));
    } else {
      this.props.setPinnedCrns([...pinnedCrns, section.crn]);
      this.props.setExcludedCrns(excludedCrns.filter(crn => crn !== section.crn));
    }
  }

  handleToggleExcluded(section) {
    const { pinnedCrns, excludedCrns } = this.props.user;
    if (excludedCrns.includes(section.crn)) {
      this.props.setExcludedCrns(excludedCrns.filter(crn => crn !== section.crn));
    } else {
      this.props.setExcludedCrns([...excludedCrns, section.crn]);
      this.props.setPinnedCrns(pinnedCrns.filter(crn => crn !== section.crn));
    }
  }

  handleToggleExpanded(expanded = !this.state.expanded) {
    this.setState({ expanded });
  }

  render() {
    const { className, courseId, expandable, onClick, onSetOverlayCrns } = this.props;
    const { courses } = this.props.oscar;
    const { pinnedCrns, excludedCrns } = this.props.user;
    const { expanded } = this.state;

    const course = courses[courseId];

    return (
      <div className={classes('Course', className)} style={{ backgroundColor: course.color }} key={course.id}
           onClick={onClick}>
        <div className="course-header" onClick={expandable ? () => this.handleToggleExpanded() : undefined}>
          <div className="row">
            <span className="course_id">{course.id}</span>
            <span className="section_ids">
              {Object.values(course.sections).filter(section => pinnedCrns.includes(section.crn)).map(section => section.id).join(', ')}
            </span>
          </div>
          <div className="row">
            <span className="course_title" dangerouslySetInnerHTML={{ __html: course.title }}/>
            {
              expandable &&
              <span className="toggle">{expanded ? '-' : '+'}</span>
            }
          </div>
        </div>
        {
          expanded &&
          <div className="sections">
            {
              Object.values(course.sections).map(section => {
                const excluded = excludedCrns.includes(section.crn);
                const pinned = pinnedCrns.includes(section.crn);
                return (
                  <div className={classes('section', excluded && 'excluded', pinned && 'pinned')}
                       key={section.id} onClick={() => this.handleTogglePinned(section)}
                       onMouseEnter={() => onSetOverlayCrns([section.crn])}
                       onMouseLeave={() => onSetOverlayCrns([])}>
                    <div className="section-header">
                      <span className="section_id">{section.id}</span>
                      <span className="instructors">{section.instructors.join(', ')}</span>
                    </div>
                    {
                      !excluded &&
                      <div className="meetings">
                        {
                          section.meetings.map((meeting, i) => {
                            return (
                              <div className="meeting" key={i}>
                                <span className="days">{meeting.days.join('')}</span>
                                <span className="period">{periodToString(meeting.period)}</span>
                              </div>
                            );
                          })
                        }
                      </div>
                    }
                    <div className="actions">
                      <div className="exclude"
                           onClick={e => {
                             e.stopPropagation();
                             this.handleToggleExcluded(section);
                           }}>{excluded ? 'Include' : 'Exclude'}</div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        }
        {
          expanded &&
          <div className="actions section-actions">
            <div className="dim" onClick={() => this.handleRemoveCourse(course)}>Remove</div>
          </div>
        }
      </div>
    );
  }
}


export default connect(({ oscar, user }) => ({ oscar, user }), actions)(Course);
