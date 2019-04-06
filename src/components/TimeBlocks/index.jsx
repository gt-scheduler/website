import React from 'react';
import { connect } from 'react-redux';
import { classes, getContentClassName, periodToString } from '../../utils';
import { CLOSE, OPEN } from '../../constants';
import { SemiPureComponent } from '../';
import { actions } from '../../reducers';
import './stylesheet.scss';

class TimeBlocks extends SemiPureComponent {
  render() {
    const { className, crn, overlay, preview, capture } = this.props;
    const { oscar } = this.props.db;
    const mobile = this.props.env.mobile && !capture;
    const { colorMap } = this.props.user;

    const section = oscar.findSection(crn);
    const color = colorMap[section.course.id];
    const textClassName = getContentClassName(color);

    return (
      <div className={classes('TimeBlocks', mobile && 'mobile', overlay && 'overlay', className)}>
        {
          section.meetings.map((meeting, i) => meeting.period && (
            meeting.days.map(day => (
              <div className={classes('meeting', textClassName, 'default', day)} key={[i, day].join('-')}
                   style={{
                     top: (meeting.period.start - OPEN) / (CLOSE - OPEN) * 100 + '%',
                     height: (meeting.period.end - meeting.period.start) / (CLOSE - OPEN) * 100 + '%',
                     backgroundColor: color,
                   }}>
                {
                  !preview &&
                  <div className="meeting-wrapper">
                    <span className="course_id">{section.course.id}{mobile ? '' : ` ${section.id}`}</span>
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

export default connect(({ env, db, user }) => ({ env, db, user }), actions)(TimeBlocks);
