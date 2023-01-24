import React, { useContext } from 'react';

import { CLOSE, OPEN } from '../../constants';
import { timeToShortString } from '../../utils/misc';
import { ScheduleContext } from '../../contexts';
import { FinalBlocks } from '..';
import { makeSizeInfoKey, FinalBlockPosition } from '../FinalBlocks';
import { Period } from '../../types';

import './stylesheet.scss';

export default function Finals(): React.ReactElement {
  const [{ pinnedCrns, oscar }] = useContext(ScheduleContext);

  // Contains the rowIndex's and rowSize's passed into each crn's TimeBlocks
  // e.g. crnSizeInfo[crn][day]["period.start-period.end"].rowIndex
  const crnSizeInfo: Record<
    string,
    Record<string, Record<string, FinalBlockPosition>>
  > = {};

  // Recursively sets the rowSize of all time blocks within the current
  // connected grouping of blocks to the current block's rowSize
  const updateJoinedRowSizes = (
    periodInfos: FinalBlockPosition[],
    seen: Set<string>,
    curCrn: string,
    curPeriod: Period,
    newRowSize: number
  ): void => {
    if (seen.has(curCrn)) {
      return;
    }
    seen.add(curCrn);

    periodInfos
      .filter(
        (period2Info) =>
          period2Info.period.start < curPeriod.end &&
          period2Info.period.end > curPeriod.start
      )
      .forEach((period2Info) => {
        period2Info.rowSize = newRowSize;
        updateJoinedRowSizes(
          periodInfos,
          seen,
          period2Info.crn,
          period2Info.period,
          newRowSize
        );
      });
  };

  const crns = Array.from(new Set([...pinnedCrns]));
  const maxMeetingLen = (crn: string): number => {
    const section = oscar.findSection(crn);
    if (section == null) return 0;
    return Math.max(
      ...section.meetings.flatMap(({ period }) => {
        if (period == null) return [];
        return [period.end - period.start];
      })
    );
  };

  crns.sort((a, b) => maxMeetingLen(a) - maxMeetingLen(b));

  // Populates crnSizeInfo by iteratively finding the next time block's
  // rowSize and rowIndex (1 more than greatest of already processed connected
  // blocks), updating the processed connected blocks to match its rowSize
  crns.forEach((crn) => {
    const section = oscar.findSection(crn);
    if (section == null) return;

    section.meetings
      .filter((m) => m.finalTime)
      .forEach((meeting) => {
        const { finalTime, finalDate } = meeting;
        if (finalTime === null || finalDate === null) return;
        const day = finalDate.toDateString();

        const dayPeriodInfos = Object.values(crnSizeInfo)
          .flatMap<FinalBlockPosition | undefined>((days) =>
            days != null ? Object.values(days[day] ?? {}) : []
          )
          .flatMap<FinalBlockPosition>((info) => (info == null ? [] : [info]));

        const curRowSize = dayPeriodInfos
          .filter(
            (period2Info) =>
              period2Info.period.start < finalTime.end &&
              period2Info.period.end > finalTime.start
          )
          .reduce(
            (acc, period2Info) => Math.max(acc, period2Info.rowSize + 1),
            1
          );

        updateJoinedRowSizes(
          dayPeriodInfos,
          new Set(),
          crn,
          finalTime,
          curRowSize
        );

        const courseSizeInfo = crnSizeInfo[crn] || {};
        crnSizeInfo[crn] = courseSizeInfo;

        const daySizeInfo = courseSizeInfo[day] || {};
        courseSizeInfo[day] = daySizeInfo;

        daySizeInfo[makeSizeInfoKey(finalTime)] = {
          period: finalTime,
          crn,
          rowIndex: curRowSize - 1,
          rowSize: curRowSize,
        };
        // meeting.days.forEach((day) => {

        // });
      });
  });

  if (oscar.finalDates.length === 0)
    return (
      <div className="FinalsEmptyContainer">
        <h2 className="FinalsEmpty">
          Finals Schedule not available for this semester
        </h2>
        <p className="FinalsEmpty">
          Find out more about updating it{' '}
          <a href="https://github.com/gt-scheduler/crawler#updating-the-list-of-finals-pdfs">
            here
          </a>
        </p>
      </div>
    );
  return (
    <div className="FinalsContainer">
      <div className="times">
        {new Array((CLOSE - OPEN) / 60).fill(0).map((_, i) => {
          const time = OPEN + i * 60;
          return (
            <div className="time" key={time}>
              <span className="label">{timeToShortString(time)}</span>
            </div>
          );
        })}
      </div>
      <div className="days">
        {oscar.finalDates.map((day) => (
          <div className="day" key={day.toLocaleString()}>
            <span className="label">
              {day.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="meetings">
        {pinnedCrns.map((crn) => (
          <FinalBlocks key={crn} crn={crn} sizeInfo={crnSizeInfo[crn] ?? {}} />
        ))}
      </div>
    </div>
  );
}
