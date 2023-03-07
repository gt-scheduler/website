import React, { useContext } from 'react';

import { CLOSE, DAYS, OPEN } from '../../constants';
import { classes, timeToShortString } from '../../utils/misc';
import { SectionBlocks, EventBlocks } from '..';
import { ScheduleContext } from '../../contexts';
import { makeSizeInfoKey } from '../TimeBlocks';
import { EventBlockPosition } from '../EventBlocks';
import { SectionBlockPosition } from '../SectionBlocks';
import { Period } from '../../types';
import useMedia from '../../hooks/useMedia';

import './stylesheet.scss';

export type CalendarProps = {
  className?: string;
  overlayCrns: string[];
  preview?: boolean;
  capture?: boolean;
  isAutosized?: boolean;
};

// Object for storing Event object and Meeting object in the same array.
type CommmonMeetingObject = {
  id: string;
  days: string[];
  period: Period;
  event: boolean;
};

export default function Calendar({
  className,
  overlayCrns,
  preview = false,
  capture = false,
  isAutosized = false,
}: CalendarProps): React.ReactElement {
  const [{ pinnedCrns, oscar, events, desiredCourses }] =
    useContext(ScheduleContext);

  // Contains the rowIndex's and rowSize's passed into each crn's TimeBlocks
  // e.g. crnSizeInfo[crn][day]["period.start-period.end"].rowIndex
  const crnSizeInfo: Record<
    string,
    Record<string, Record<string, SectionBlockPosition>>
  > = {};

  // Contains the rowIndex's and rowSize's passed into each custom event's
  // TimeBlocks, consistent with the rowIndex's and rowSize's of crns
  const eventSizeInfo: Record<
    string,
    Record<string, Record<string, EventBlockPosition>>
  > = {};

  // Recursively sets the rowSize of all time blocks within the current
  // connected grouping of blocks to the current block's rowSize
  const updateJoinedRowSizes = (
    periodInfos: (SectionBlockPosition | EventBlockPosition)[],
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
          'crn' in period2Info ? period2Info.crn : period2Info.id,
          period2Info.period,
          newRowSize
        );
      });
  };

  const crns = Array.from(new Set([...pinnedCrns, ...(overlayCrns || [])]));

  // Find section using crn and convert the meetings into
  // an array of CommonMeetingObject
  const crnMeetings: (CommmonMeetingObject | null)[] = crns
    .flatMap((crn) => {
      const section = oscar.findSection(crn);
      if (section == null) return null;
      const temp = section.meetings
        .filter((m) => m.period)
        .map((meeting) => {
          return {
            id: crn,
            days: meeting.days,
            period: meeting.period,
            event: false,
          } as CommmonMeetingObject;
        });

      return temp;
    })
    .filter((m) => m != null);

  const meetings: CommmonMeetingObject[] =
    crnMeetings as CommmonMeetingObject[];

  // Add events to meetings array
  meetings.push(
    ...events.map((event) => {
      return {
        id: event.id,
        days: event.days,
        period: event.period,
        event: true,
      } as CommmonMeetingObject;
    })
  );

  // Sort meetings by meeting length
  meetings.sort(
    (a, b) =>
      a.period.end - a.period.start - (b.period.end - b.period.start) ?? 0
  );

  // Populates crnSizeInfo and eventSizeInfo by iteratively finding the
  // next time block's rowSize and rowIndex (1 more than
  // greatest of already processed connected blocks), updating
  // the processed connected blocks to match its rowSize
  meetings.forEach((meeting) => {
    const { period } = meeting;
    if (period == null) return;

    meeting.days.forEach((day) => {
      const crnPeriodInfos = Object.values(crnSizeInfo)
        .flatMap<SectionBlockPosition | undefined>((days) =>
          days != null ? Object.values(days[day] ?? {}) : []
        )
        .flatMap<SectionBlockPosition>((info) => (info == null ? [] : [info]));

      const eventPeriodInfos = Object.values(eventSizeInfo)
        .flatMap<EventBlockPosition | undefined>((days) =>
          days != null ? Object.values(days[day] ?? {}) : []
        )
        .flatMap<EventBlockPosition>((info) => (info == null ? [] : [info]));

      const dayPeriodInfos: (SectionBlockPosition | EventBlockPosition)[] =
        crnPeriodInfos;
      dayPeriodInfos.push(...eventPeriodInfos);

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
        meeting.id,
        period,
        curRowSize
      );

      if (!meeting.event) {
        const courseSizeInfo = crnSizeInfo[meeting.id] || {};
        crnSizeInfo[meeting.id] = courseSizeInfo;

        const daySizeInfo = courseSizeInfo[day] || {};
        courseSizeInfo[day] = daySizeInfo;

        daySizeInfo[makeSizeInfoKey(period)] = {
          period,
          crn: meeting.id,
          rowIndex: curRowSize - 1,
          rowSize: curRowSize,
        };
      } else {
        const evtSizeInfo = eventSizeInfo[meeting.id] || {};
        eventSizeInfo[meeting.id] = evtSizeInfo;

        const eventDaySizeInfo = evtSizeInfo[day] || {};
        evtSizeInfo[day] = eventDaySizeInfo;

        eventDaySizeInfo[makeSizeInfoKey(meeting.period)] = {
          period: meeting.period,
          id: meeting.id,
          rowIndex: curRowSize - 1,
          rowSize: curRowSize,
        };
      }
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

  const filteredCourses = oscar.courses.filter((course) => {
    if (desiredCourses.includes(course.id)) {
      return course;
    }
    return '';
  });

  const finalFilteredCourses = filteredCourses.filter((course) => {
    let match;

    pinnedCrns.forEach((courseCrn) => {
      course.sections.forEach((section) => {
        if (courseCrn === section.crn) {
          if (
            section.campus !== 'Georgia Tech-Atlanta *' ||
            section.meetings[0]?.days.includes('S')
          ) {
            match = course;
          }
          return '';
        }
        return '';
      });
      return '';
    });
    return match;
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
          <SectionBlocks
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
              <SectionBlocks
                key={crn}
                crn={crn}
                overlay={!preview}
                includeContent={!preview}
                capture={capture}
                includeDetailsPopover={false}
                sizeInfo={crnSizeInfo[crn] ?? {}}
              />
            ))}
        {events &&
          events.map((event) => (
            <EventBlocks
              event={event}
              capture={capture}
              sizeInfo={eventSizeInfo[event.id] ?? {}}
              includeDetailsPopover={!isAutosized && !capture}
              includeContent={!preview}
              canBeTabFocused={!isAutosized && !capture}
              deviceHasHover={deviceHasHover}
              selectedMeeting={
                selectedMeeting !== null && selectedMeeting[0] === event.id
                  ? [selectedMeeting[1], selectedMeeting[2]]
                  : null
              }
              onSelectMeeting={(meeting: [number, string] | null): void => {
                if (meeting === null) {
                  setSelectedMeeting(null);
                } else {
                  setSelectedMeeting([event.id, meeting[0], meeting[1]]);
                }
              }}
            />
          ))}
      </div>
      {finalFilteredCourses.length !== 0 ? (
        <div className="hidden-courses">
          *Other Courses/Events not shown in view:{' '}
          {finalFilteredCourses.map((course) => {
            let sectionId = '';
            pinnedCrns.filter((crn) => {
              course.sections.every((section) => {
                if (section.crn === crn) {
                  sectionId = section.id;
                }
                return 'i';
              });
              return 'j';
            });
            return `${course.id}(${sectionId}), `;
          })}
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
