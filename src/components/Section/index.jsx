import React, { Component } from 'react';
import { classes, periodToString } from '../../utils';
import { CLOSE, OPEN } from '../../constants';
import './stylesheet.scss';

class Section extends Component {
  render() {
    const { className, section, overlay, preview, mobile } = this.props;

    return (
      <div className={classes('Section', mobile && 'mobile', overlay && 'overlay', className)}>
        {
          section.meetings.map((meeting, i) => meeting.period && (
            meeting.days.map(day => (
              <div className={`meeting ${day}`} key={[i, day].join('-')}
                   style={{
                     top: (meeting.period.start - OPEN) / (CLOSE - OPEN) * 100 + '%',
                     height: (meeting.period.end - meeting.period.start) / (CLOSE - OPEN) * 100 + '%',
                     backgroundColor: meeting.course.color,
                   }}>
                {
                  !preview &&
                  <div className="meeting-wrapper">
                    <span className="course_id">{meeting.course.id}{mobile ? '' : ` ${meeting.section.id}`}</span>
                    <span className="period">{periodToString(meeting.period)}</span>
                    {
                      !mobile &&
                      <span className="where">{meeting.where}</span>
                    }
                    {
                      !mobile &&
                      <span className="instructors">{meeting.instructors.join(', ')}</span>
                    }
                  </div>
                }
              </div>
            ))
          ))
        }
      </div>
    );
  }
}


export default Section;
