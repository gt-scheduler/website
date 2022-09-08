import React, { useContext } from 'react';

import { classes, getContentClassName, periodToString } from '../../utils/misc';
import { CLOSE, OPEN } from '../../constants';
import { ScheduleContext } from '../../contexts';
import { Period } from '../../types';

import './stylesheet.scss';

export interface FinalBlockPosition {
  rowIndex: number;
  rowSize: number;
  period: Period;
  crn: string;
}

export type SizeInfo = Record<string, Record<string, FinalBlockPosition>>;

export type FinalBlocksProps = {
  className?: string;
  crn: string;
  sizeInfo: SizeInfo;
};

export function makeSizeInfoKey(period: Period): string {
  return [period.start, period.end].join('-');
}

export default function FinalBlocks({
  className,
  crn,
  sizeInfo,
}: FinalBlocksProps): React.ReactElement | null {
  const [{ oscar, colorMap }] = useContext(ScheduleContext);

  const section = oscar.findSection(crn);
  if (section == null) return null;

  const color = colorMap[section.course.id];
  const contentClassName = getContentClassName(color);

  return (
    <div className={classes('FinalBlocks', className)}>
      {section.meetings.map((meeting, i) => {
        const { finalTime, finalDate } = meeting;
        if (finalTime === null || finalDate === null) return;

        const sizeInfoKey = makeSizeInfoKey(finalTime);
        const day = finalDate.toDateString();
        const sizeInfoDay = sizeInfo[day];
        if (sizeInfoDay == null) return;
        const sizeInfoPeriodDay = sizeInfoDay[sizeInfoKey];
        if (sizeInfoPeriodDay == null) return;
        const width = 100 / oscar.finalDates.length;
        return (
          <div
            className={classes('meeting', contentClassName, 'default', day)}
            key={[i, day].join('-')}
            style={{
              top: `${((finalTime.start - OPEN) / (CLOSE - OPEN)) * 100}%`,
              height: `${
                ((finalTime.end - finalTime.start) / (CLOSE - OPEN)) * 100
              }%`,
              width: `${width / sizeInfoPeriodDay.rowSize}%`,
              left: `${
                oscar.finalDates.indexOf(finalDate) * width +
                sizeInfoPeriodDay.rowIndex * (width / sizeInfoPeriodDay.rowSize)
              }%`,
              backgroundColor: color,
            }}
          >
            <div className="meeting-wrapper">
              <div className="ids">
                <span className="course-id">{section.course.id}</span>
                <span className="section-id">&nbsp;{section.id}</span>
              </div>
              <span className="period">{periodToString(finalTime)}</span>
              <span className="instructors">
                {meeting.instructors.join(', ')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
