import React, { Component } from 'react';
import './Course.scss';
import { classes, periodToString } from './util';

class Course extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
    };
  }

  handleToggleExpanded(expanded = !this.state.expanded) {
    this.setState({ expanded });
  }

  render() {
    const { course, expandable, onClick, onRemove, onTogglePinned, onToggleExcluded, onSetOverlayCrns, pinnedCrns, excludedCrns } = this.props;
    const { expanded } = this.state;

    return (
      <div className="Course" style={{ backgroundColor: course.color }} key={course.id} onClick={onClick}>
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
                       key={section.id} onClick={() => onTogglePinned(section)}
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
                             onToggleExcluded(section);
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
            <div className="dim" onClick={() => onRemove(course)}>Remove</div>
          </div>
        }
      </div>
    );
  }
}


export default Course;
