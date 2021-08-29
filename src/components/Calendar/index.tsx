import React, { useContext } from 'react';

import { CLOSE, DAYS, OPEN } from '../../constants';
import { classes, timeToShortString } from '../../utils';
import { TimeBlocks } from '..';
import { TermContext } from '../../contexts';
import { makeSizeInfoKey, TimeBlockPosition } from '../TimeBlocks';
import { Period, SafeRecord } from '../../types';

import './stylesheet.scss';

export type CalendarProps = {
  className?: string;
  overlayCrns: string[];
  preview?: boolean;
  capture?: boolean;
  isAutosized?: boolean;
};

export default function Calendar({
  className,
  overlayCrns,
  preview = false,
  capture = false,
  isAutosized = false
}: CalendarProps): React.ReactElement {
  const [{ pinnedCrns, oscar }] = useContext(TermContext);

  // Contains the rowIndex's and rowSize's passed into each crn's TimeBlocks
  // e.g. crnSizeInfo[crn][day]["period.start-period.end"].rowIndex
  const crnSizeInfo: SafeRecord<
    string,
    SafeRecord<string, SafeRecord<string, TimeBlockPosition>>
  > = {};

  // Recursively sets the rowSize of all time blocks within the current
  // connected grouping of blocks to the current block's rowSize
  const updateJoinedRowSizes = (
    periodInfos: TimeBlockPosition[],
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

  const crns = Array.from(new Set([...pinnedCrns, ...(overlayCrns || [])]));
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
      .filter((m) => m.period)
      .forEach((meeting) => {
        const { period } = meeting;
        if (period == null) return;

        meeting.days.forEach((day) => {
          const dayPeriodInfos = Object.values(crnSizeInfo)
            .flatMap<TimeBlockPosition | undefined>((days) =>
              days != null ? Object.values(days[day] ?? {}) : []
            )
            .flatMap<TimeBlockPosition>((info) => (info == null ? [] : [info]));

          const curRowSize = dayPeriodInfos
            .filter(
              (period2Info) =>
                period2Info.period.start < period.end &&
                period2Info.period.end > period.start
            )
            .reduce(
              (acc, period2Info) => Math.max(acc, period2Info.rowSize + 1),
              1
            );

          updateJoinedRowSizes(
            dayPeriodInfos,
            new Set(),
            crn,
            period,
            curRowSize
          );

          const courseSizeInfo = crnSizeInfo[crn] || {};
          crnSizeInfo[crn] = courseSizeInfo;

          const daySizeInfo = courseSizeInfo[day] || {};
          courseSizeInfo[day] = daySizeInfo;

          daySizeInfo[makeSizeInfoKey(period)] = {
            period,
            crn,
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
            sizeInfo={crnSizeInfo[crn] ?? {}}
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
                sizeInfo={crnSizeInfo[crn] ?? {}}
              />
            ))}
      </div>
    </div>
  );
}
