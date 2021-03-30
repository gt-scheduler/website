import React, { useContext } from 'react';
import ReactTooltip from 'react-tooltip';
import { classes, getContentClassName, periodToString } from '../../utils';
import { CLOSE, OPEN, DAYS } from '../../constants';
import './stylesheet.scss';
import { TermContext } from '../../contexts';

export default function TimeBlocks({
  className,
  crn,
  overlay,
  preview,
  capture,
  isAutosized,
  sizeInfo
}) {
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
        className
      )}
    >
      {section.meetings.map(
        (meeting, i) =>
          meeting.period &&
          meeting.days.map((day) => (
            <div
              className={classes('meeting', contentClassName, 'default', day)}
              key={[i, day].join('-')}
              style={{
                top: `${
                  ((meeting.period.start - OPEN) / (CLOSE - OPEN)) * 100
                }%`,
                height: `${
                  ((meeting.period.end - meeting.period.start) /
                    (CLOSE - OPEN)) *
                  100
                }%`,
                width: `${
                  20 /
                  sizeInfo[day][
                    [meeting.period.start, meeting.period.end].join('-')
                  ].rowSize
                }%`,
                left: `${
                  DAYS.indexOf(day) * 20 +
                  sizeInfo[day][
                    [meeting.period.start, meeting.period.end].join('-')
                  ].rowIndex *
                    (20 /
                      sizeInfo[day][
                        [meeting.period.start, meeting.period.end].join('-')
                      ].rowSize)
                }%`,
                backgroundColor: color
              }}
              data-tip
              data-for={crn}
            >
              {!preview && (
                <div className="meeting-wrapper">
                  <div className="ids">
                    <span className="course-id">{section.course.id}</span>
                    <span className="section-id">&nbsp;{section.id}</span>
                  </div>
                  <span className="period">
                    {periodToString(meeting.period)}
                  </span>
                  <span className="where">{meeting.where}</span>
                  <span className="instructors">
                    {meeting.instructors.join(', ')}
                  </span>
                </div>
              )}
            </div>
          ))
      )}

      {!isAutosized && (
        <ReactTooltip
          id={crn}
          className="tooltip"
          type="dark"
          place="top"
          effect="solid"
        >
          <table>
            <tbody>
              <tr>
                <td>
                  <b>Course Name</b>
                </td>
                <td>{section.course.title}</td>
              </tr>
              <tr>
                <td>
                  <b>Delivery Type</b>
                </td>
                <td>{section.deliveryMode}</td>
              </tr>
              <tr>
                <td>
                  <b>Course Number</b>
                </td>
                <td>{section.crn}</td>
              </tr>
              <tr>
                <td>
                  <b>Credit Hours</b>
                </td>
                <td>{section.credits}</td>
              </tr>
            </tbody>
          </table>
        </ReactTooltip>
      )}
    </div>
  );
}
