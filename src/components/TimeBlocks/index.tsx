import React, { useContext } from 'react';
import ReactTooltip from 'react-tooltip';

import { classes, getContentClassName, periodToString } from '../../utils/misc';
import { CLOSE, OPEN, DAYS } from '../../constants';
import { TermContext } from '../../contexts';
import { Period } from '../../types';

import './stylesheet.scss';

export interface TimeBlockPosition {
  rowIndex: number;
  rowSize: number;
  period: Period;
  crn: string;
}

export type SizeInfo = Record<string, Record<string, TimeBlockPosition>>;

export type TimeBlocksProps = {
  className?: string;
  crn: string;
  overlay?: boolean;
  capture: boolean;
  preview: boolean;
  isAutosized: boolean;
  sizeInfo: SizeInfo;
};

export function makeSizeInfoKey(period: Period): string {
  return [period.start, period.end].join('-');
}

export default function TimeBlocks({
  className,
  crn,
  overlay = false,
  preview,
  capture,
  isAutosized,
  sizeInfo,
}: TimeBlocksProps): React.ReactElement | null {
  const [{ oscar, colorMap }] = useContext(TermContext);

  const section = oscar.findSection(crn);
  if (section == null) return null;

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
      {section.meetings.map((meeting, i) => {
        const { period } = meeting;
        if (period == null) return;

        const sizeInfoKey = makeSizeInfoKey(period);
        return meeting.days.map((day) => {
          const sizeInfoDay = sizeInfo[day];
          if (sizeInfoDay == null) return;
          const sizeInfoPeriodDay = sizeInfoDay[sizeInfoKey];
          if (sizeInfoPeriodDay == null) return;

          return (
            <div
              className={classes('meeting', contentClassName, 'default', day)}
              key={[i, day].join('-')}
              style={{
                top: `${((period.start - OPEN) / (CLOSE - OPEN)) * 100}%`,
                height: `${
                  ((period.end - period.start) / (CLOSE - OPEN)) * 100
                }%`,
                width: `${20 / sizeInfoPeriodDay.rowSize}%`,
                left: `${
                  DAYS.indexOf(day) * 20 +
                  sizeInfoPeriodDay.rowIndex * (20 / sizeInfoPeriodDay.rowSize)
                }%`,
                backgroundColor: color,
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
                  <span className="period">{periodToString(period)}</span>
                  <span className="where">{meeting.where}</span>
                  <span className="instructors">
                    {meeting.instructors.join(', ')}
                  </span>
                </div>
              )}
            </div>
          );
        });
      })}

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
