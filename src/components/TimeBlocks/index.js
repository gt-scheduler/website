import React, { useContext } from 'react';
import { classes, getContentClassName, periodToString } from '../../utils';
import { CLOSE, OPEN } from '../../constants';
import './stylesheet.scss';
import { TermContext } from '../../contexts';

export function TimeBlocks({ className, crn, overlay, preview, capture }) {
  const [{ oscar, colorMap }] = useContext(TermContext);

  const section = oscar.findSection(crn);
  const color = colorMap[section.course.id];
  const contentClassName = getContentClassName(color);

  return (
    <div
      className={classes(
        'TimeBlocks',
        capture && 'capture',
        overlay && 'overlay',
        className,
      )}
    >
      {section.meetings.map(
        (meeting, i) =>
          meeting.period &&
          meeting.days.map((day) => (
            <div className={classes('meeting', contentClassName, 'default', day)}
                 key={[i, day].join('-')}
                 style={{
                   top:
                     ((meeting.period.start - OPEN) / (CLOSE - OPEN)) * 100 +
                     '%',
                   height:
                     ((meeting.period.end - meeting.period.start) /
                       (CLOSE - OPEN)) *
                     100 +
                     '%',
                   backgroundColor: color,
                 }}>
              {
                !preview && (
                  <div className="meeting-wrapper">
                    <div className="ids">
                      <span className="course-id">
                        {section.course.id}
                      </span>
                      <span className="section-id">
                        &nbsp;{section.id}
                      </span>
                    </div>
                    <span className="period">
                      {periodToString(meeting.period)}
                    </span>
                    <span className="where">{meeting.where}</span>
                    <span className="instructors">
                      {meeting.instructors.join(', ')}
                    </span>
                  </div>
                )
              }
            </div>
          )),
      )}
    </div>
  );
}
