import React, { useContext } from 'react';

import { CLOSE, DAYS, OPEN } from '../../constants';
import { classes, timeToShortString } from '../../utils/misc';
import { TimeBlocks } from '..';
import { ScheduleContext } from '../../contexts';
import { makeSizeInfoKey, TimeBlockPosition } from '../TimeBlocks';
import { Meeting, Period } from '../../types';
import useMedia from '../../hooks/useMedia';

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
  isAutosized = false,
}: CalendarProps): React.ReactElement {
  const [{ pinnedCrns, oscar }] = useContext(ScheduleContext);

  // Contains the rowIndex's and rowSize's passed into each crn's TimeBlocks
  // e.g. crnSizeInfo[crn][day]["period.start-period.end"].rowIndex
  const crnSizeInfo: Record<
    string,
    Record<string, Record<string, TimeBlockPosition>>
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
            rowSize: curRowSize,
          };
        });
      });
  });

  // Allow the user to select a meeting, which will cause it to be highlighted
  // and for the meeting "details" popover/tooltip to remain open.
  type SelectedMeeting = [crn: string, meetingIndex: number, day: string];
  const [selectedMeeting, setSelectedMeeting] =
    React.useState<SelectedMeeting | null>(null);

  const deviceHasHover = useMedia('(hover: hover)');

  // Render pinned CRNS in the order of their first meeting in the day,
  // across all days. This results in better tab-ordering.
  const pinnedCrnsByFirstMeeting: string[] = pinnedCrns
    .map((crn) => {
      const section = oscar.findSection(crn);
      if (section == null) return null;
      const firstMeetingPeriod = section.meetings
        .map((m) => m.period)
        .filter((m): m is Period => m != null)
        .sort((a, b) => a.start - b.start)[0];
      if (firstMeetingPeriod == null) return null;
      return [crn, firstMeetingPeriod] as const;
    })
    .filter((crn): crn is [string, Period] => crn != null)
    .sort((a, b) => a[1].start - b[1].start)
    .map(([crn]) => crn);
  // If there are any pinned CRNs that got filtered out, add them to the end.
  const filteredSet = new Set(pinnedCrnsByFirstMeeting);
  pinnedCrns.forEach((crn) => {
    if (!filteredSet.has(crn)) {
      pinnedCrnsByFirstMeeting.push(crn);
    }
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
        {pinnedCrnsByFirstMeeting.map((crn) => (
          <TimeBlocks
            key={crn}
            crn={crn}
            capture={capture}
            includeDetailsPopover={!isAutosized && !capture}
            includeContent={!preview}
            sizeInfo={crnSizeInfo[crn] ?? {}}
            selectedMeeting={
              selectedMeeting !== null && selectedMeeting[0] === crn
                ? [selectedMeeting[1], selectedMeeting[2]]
                : null
            }
            onSelectMeeting={(meeting: [number, string] | null): void => {
              if (meeting === null) {
                setSelectedMeeting(null);
              } else {
                setSelectedMeeting([crn, meeting[0], meeting[1]]);
              }
            }}
            deviceHasHover={deviceHasHover}
            canBeTabFocused={!isAutosized && !capture}
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
                includeContent={!preview}
                capture={capture}
                includeDetailsPopover={false}
                sizeInfo={crnSizeInfo[crn] ?? {}}
              />
            ))}
      </div>
    </div>
  );
}
