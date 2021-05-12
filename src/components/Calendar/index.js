import React, { useContext } from 'react';
import { CLOSE, DAYS, OPEN } from '../../constants';
import { classes, timeToShortString } from '../../utils';
import { TimeBlocks } from '..';
import './stylesheet.scss';
import { ScheduleContext } from '../../contexts';

export default function Calendar({
  className,
  overlayCrns,
  preview,
  capture,
  isAutosized
}) {
  const [{ pinnedCrns, oscar }] = useContext(ScheduleContext);

  // Contains the rowIndex's and rowSize's passed into each crn's TimeBlocks
  // e.g. crnSizeInfo[crn][day]["period.start-period.end"].rowIndex
  const crnSizeInfo = {};

  // Recursively sets the rowSize of all time blocks within the current
  // connected grouping of blocks to the current block's rowSize
  const updateJoinedRowSizes = (
    periodInfos,
    seen,
    curCrn,
    curPeriod,
    newRowSize
  ) => {
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

  const crns = [...new Set([...pinnedCrns, ...(overlayCrns || [])])];
  const maxMeetingLen = (crn) =>
    Math.max(
      ...oscar
        .findSection(crn)
        .meetings.filter((m) => m.period)
        .map((m) => m.period.end - m.period.start)
    );
  crns.sort((a, b) => maxMeetingLen(a) - maxMeetingLen(b));

  // Populates crnSizeInfo by iteratively finding the next time block's
  // rowSize and rowIndex (1 more than greatest of already processed connected
  // blocks), updating the processed connected blocks to match its rowSize
  crns.forEach((crn) => {
    crnSizeInfo[crn] = {};

    oscar
      .findSection(crn)
      .meetings.filter((m) => m.period)
      .forEach((meeting) => {
        meeting.days.forEach((day) => {
          crnSizeInfo[crn][day] = crnSizeInfo[crn][day] || {};

          const dayPeriodInfos = Object.values(crnSizeInfo)
            .filter((days) => days[day])
            .map((days) => Object.values(days[day]))
            .flat();

          const curRowSize = dayPeriodInfos
            .filter(
              (period2Info) =>
                period2Info.period.start < meeting.period.end &&
                period2Info.period.end > meeting.period.start
            )
            .reduce(
              (acc, period2Info) => Math.max(acc, period2Info.rowSize + 1),
              1
            );

          updateJoinedRowSizes(
            dayPeriodInfos,
            new Set(),
            crn,
            meeting.period,
            curRowSize
          );

          crnSizeInfo[crn][day][
            [meeting.period.start, meeting.period.end].join('-')
          ] = {
            period: meeting.period,
            rowIndex: curRowSize - 1,
            rowSize: curRowSize
          };
        });
      });
  });

  return (
    <div
      className={classes(
        'Calendar',
        capture && 'capture',
        preview && 'preview',
        className
      )}
    >
      {!preview && (
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
      )}
      {!preview && (
        <div className="days">
          {DAYS.map((day) => (
            <div className="day" key={day}>
              <span className="label">{day}</span>
            </div>
          ))}
        </div>
      )}
      <div className="meetings">
        {pinnedCrns.map((crn) => (
          <TimeBlocks
            key={crn}
            crn={crn}
            preview={preview}
            capture={capture}
            isAutosized={isAutosized}
            sizeInfo={crnSizeInfo[crn]}
          />
        ))}
        {overlayCrns &&
          overlayCrns
            .filter((crn) => !pinnedCrns.includes(crn))
            .map((crn) => (
              <TimeBlocks
                key={crn}
                crn={crn}
                overlay={!preview}
                preview={preview}
                capture={capture}
                isAutosized
                sizeInfo={crnSizeInfo[crn]}
              />
            ))}
      </div>
    </div>
  );
}
