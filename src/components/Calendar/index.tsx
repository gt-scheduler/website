import React, { useContext } from 'react';
import { Immutable } from 'immer';

import { FriendScheduleData } from '../../data/types';
import { Section } from '../../data/beans';
import { CLOSE, DAYS, OPEN, RECURRING_EVENTS } from '../../constants';
import { classes, timeToShortString } from '../../utils/misc';
import { SectionBlocks, EventBlocks, CompareBlocks } from '..';
import { ScheduleContext, FriendContext } from '../../contexts';
import { makeSizeInfoKey } from '../TimeBlocks';
import { EventBlockPosition } from '../EventBlocks';
import { SectionBlockPosition } from '../SectionBlocks';
import EventDrag from '../EventDrag';
import { Period, Event } from '../../types';
import useMedia from '../../hooks/useMedia';

import './stylesheet.scss';

export type CalendarProps = {
  className?: string;
  overlayCrns: string[];
  preview?: boolean;
  capture?: boolean;
  compare?: boolean;
  pinnedFriendSchedules?: string[];
  pinSelf?: boolean;
  overlayFriendSchedules?: string[];
  isAutosized?: boolean;
};

// Object for storing Event object and Meeting object in the same array.
type CommonMeetingObject = {
  id: string;
  days: string[];
  period: Period;
  event: boolean;
};

type FriendCrnData = {
  friend: string;
  scheduleId: string;
  scheduleName: string;
  crn: string;
};

type FriendEventData = {
  friend: string;
  scheduleId: string;
  scheduleName: string;
  id: string;
  event: Event;
};

export default function Calendar({
  className,
  overlayCrns,
  preview = false,
  capture = false,
  compare = false,
  pinnedFriendSchedules = [],
  pinSelf = true,
  overlayFriendSchedules = [],
  isAutosized = false,
}: CalendarProps): React.ReactElement {
  const [
    { pinnedCrns, oscar, events, currentVersion, versions, courseContainerTab },
  ] = useContext(ScheduleContext);

  const [{ friends }] = useContext(FriendContext);

  // Contains the rowIndex's and rowSize's passed into each crn's TimeBlocks
  // e.g. meetingSizeInfo[crn/id][day]["period.start-period.end"].rowIndex
  const meetingSizeInfo: Record<
    string,
    Record<string, Record<string, SectionBlockPosition | EventBlockPosition>>
  > = {};

  const daysRef = React.useRef<HTMLDivElement>(null);
  const timesRef = React.useRef<HTMLDivElement>(null);
  const calendarRef = React.useRef<HTMLDivElement>(null);

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

  const crns =
    pinSelf && !compare
      ? Array.from(new Set([...pinnedCrns, ...(overlayCrns || [])]))
      : [];

  // Find section using crn and convert the meetings into
  // an array of CommonMeetingObject
  const crnMeetings: (CommonMeetingObject | null)[] = crns
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
          } as CommonMeetingObject;
        });

      return temp;
    })
    .filter((m) => m != null);

  const meetings: CommonMeetingObject[] = crnMeetings as CommonMeetingObject[];

  if (!compare && pinSelf) {
    // Add events to meetings array
    meetings.push(
      ...events.map((event) => {
        return {
          id: event.id,
          days: event.days,
          period: event.period,
          event: true,
        } as CommonMeetingObject;
      })
    );
  }

  // Sort meetings by meeting length
  meetings.sort(
    (a, b) =>
      a.period.end - a.period.start - (b.period.end - b.period.start) ?? 0
  );

  const userSchedules: { data: FriendCrnData; overlay: boolean }[] = [];
  const userEvents: { data: FriendEventData; overlay: boolean }[] = [];
  if (compare) {
    /*
    Create a dummy friend schedule data object for self schedules for
    conforming types to iterate over all schedules in one go
    */
    const selfFriend: Immutable<FriendScheduleData> = {
      self: {
        name: 'Me',
        email: '',
        versions,
      },
    };
    const allUsers = { ...friends, ...selfFriend };

    Object.values(allUsers).forEach((friend) =>
      Object.entries(friend.versions)
        .filter(
          (schedule) =>
            pinnedFriendSchedules.includes(schedule[0]) ||
            overlayFriendSchedules.includes(schedule[0])
        )
        .forEach((schedule) => {
          const friendMeetings: CommonMeetingObject[] = [];
          schedule[1].schedule.pinnedCrns.forEach((crn) => {
            userSchedules.push({
              data: {
                friend: friend.name,
                scheduleName: schedule[1].name,
                scheduleId: schedule[0],
                crn,
              } as FriendCrnData,
              overlay: !pinnedFriendSchedules.includes(schedule[0]),
            });

            const section = oscar.findSection(crn);
            if (section == null) return;
            section.meetings
              .filter((m) => m.period)
              .forEach((meeting) => {
                friendMeetings.push({
                  id: `${schedule[0]}-${crn}`,
                  days: meeting.days,
                  period: meeting.period,
                  event: false,
                } as CommonMeetingObject);
              });
          });
          schedule[1].schedule.events.forEach((event) => {
            userEvents.push({
              data: {
                friend: friend.name,
                scheduleName: schedule[1].name,
                scheduleId: schedule[0],
                id: event.id,
                event,
              } as FriendEventData,
              overlay: !pinnedFriendSchedules.includes(schedule[0]),
            });
            friendMeetings.push({
              id: `${schedule[0]}-${event.id}`,
              days: event.days,
              period: event.period,
              event: true,
            } as CommonMeetingObject);
          });
          friendMeetings.sort(
            (a, b) =>
              a.period.end - a.period.start - (b.period.end - b.period.start) ??
              0
          );
          meetings.push(...friendMeetings);
        })
    );
  }

  // Populates crnSizeInfo and eventSizeInfo by iteratively finding the
  // next time block's rowSize and rowIndex (1 more than
  // greatest of already processed connected blocks), updating
  // the processed connected blocks to match its rowSize
  meetings.forEach((meeting) => {
    const { period } = meeting;
    if (period == null) return;

    meeting.days.forEach((day) => {
      const dayPeriodInfos = Object.values(meetingSizeInfo)
        .flatMap<SectionBlockPosition | EventBlockPosition | undefined>(
          (days) => (days != null ? Object.values(days[day] ?? {}) : [])
        )
        .flatMap<SectionBlockPosition | EventBlockPosition>((info) =>
          info == null ? [] : [info]
        );

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

      const mSizeInfo = meetingSizeInfo[meeting.id] || {};
      meetingSizeInfo[meeting.id] = mSizeInfo;

      const daySizeInfo = mSizeInfo[day] || {};
      mSizeInfo[day] = daySizeInfo;

      if (!meeting.event) {
        daySizeInfo[makeSizeInfoKey(period)] = {
          period,
          crn: meeting.id,
          rowIndex: curRowSize - 1,
          rowSize: curRowSize,
        };
      } else {
        daySizeInfo[makeSizeInfoKey(period)] = {
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

  // Filter for hidden sections (i.e., TBA and weekend sections)
  const hiddenSections: Section[] = crns
    .map((crn) => oscar.findSection(crn))
    .filter(
      (section) =>
        section !== undefined &&
        section.meetings.some(
          (meeting) =>
            meeting.period === undefined ||
            meeting.days.includes('S') ||
            meeting.days.includes('U')
        )
    ) as Section[];

  return (
    <div
      className={classes(
        'Calendar',
        capture && 'capture',
        preview && 'preview',
        className
      )}
      ref={calendarRef}
    >
      {!preview && (
        <div className="times" ref={timesRef}>
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
        <div className="days" ref={daysRef}>
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
            schedule={compare ? currentVersion : undefined}
            crn={crn}
            capture={capture}
            includeDetailsPopover={!isAutosized && !capture}
            includeContent={!preview}
            sizeInfo={meetingSizeInfo[crn] ?? {}}
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
                schedule={compare ? currentVersion : undefined}
                crn={crn}
                overlay={!preview}
                includeContent={!preview}
                capture={capture}
                includeDetailsPopover={false}
                sizeInfo={meetingSizeInfo[crn] ?? {}}
              />
            ))}
        {events &&
          events.map((event) => (
            <EventBlocks
              key={`${event.id}-${event.period.start}-${event.days.join()}`}
              scheduleId={compare ? currentVersion : undefined}
              event={event}
              capture={capture}
              sizeInfo={meetingSizeInfo[event.id] ?? {}}
              includeDetailsPopover={!isAutosized && !capture}
              includeContent={!preview}
              canBeTabFocused={!isAutosized && !capture}
              deviceHasHover={deviceHasHover}
              daysRef={daysRef}
              timesRef={timesRef}
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
        {compare &&
          userSchedules.map(({ data, overlay }) => (
            <CompareBlocks
              key={`${data.scheduleId}-${data.crn}`}
              crn={data.crn}
              owner={data.friend}
              scheduleId={data.scheduleId}
              scheduleName={data.scheduleName}
              capture={capture}
              includeDetailsPopover={!isAutosized && !capture}
              includeContent={!preview}
              sizeInfo={meetingSizeInfo[`${data.scheduleId}-${data.crn}`] ?? {}}
              overlay={overlay}
              selectedMeeting={
                selectedMeeting !== null &&
                selectedMeeting[0] === `${data.scheduleId}-${data.crn}`
                  ? [selectedMeeting[1], selectedMeeting[2]]
                  : null
              }
              onSelectMeeting={(meeting: [number, string] | null): void => {
                if (meeting === null) {
                  setSelectedMeeting(null);
                } else {
                  setSelectedMeeting([
                    `${data.scheduleId}-${data.crn}`,
                    meeting[0],
                    meeting[1],
                  ]);
                }
              }}
              deviceHasHover={deviceHasHover}
              canBeTabFocused={!isAutosized && !capture}
            />
          ))}
        {compare &&
          userEvents.map(({ data, overlay }) => (
            <EventBlocks
              key={`${data.scheduleId}-${data.id}`}
              event={data.event}
              owner={data.friend}
              scheduleId={data.scheduleId}
              scheduleName={data.scheduleName}
              capture={capture}
              sizeInfo={meetingSizeInfo[`${data.scheduleId}-${data.id}`] ?? {}}
              overlay={overlay}
              includeDetailsPopover={!isAutosized && !capture}
              includeContent={!preview}
              canBeTabFocused={!isAutosized && !capture}
              deviceHasHover={deviceHasHover}
              selectedMeeting={
                selectedMeeting !== null &&
                selectedMeeting[0] === `${data.scheduleId}-${data.id}`
                  ? [selectedMeeting[1], selectedMeeting[2]]
                  : null
              }
              onSelectMeeting={(meeting: [number, string] | null): void => {
                if (meeting === null) {
                  setSelectedMeeting(null);
                } else {
                  setSelectedMeeting([
                    `${data.scheduleId}-${data.id}`,
                    meeting[0],
                    meeting[1],
                  ]);
                }
              }}
            />
          ))}
      </div>
      <EventDrag
        enabled={
          courseContainerTab === RECURRING_EVENTS && !compare && deviceHasHover
        }
        daysRef={daysRef}
        timesRef={timesRef}
        deviceHasHover={deviceHasHover}
        containerRef={calendarRef}
      />
      {!preview && hiddenSections.length > 0 && (
        <div className="hidden-sections">
          *Sections not shown in view:{' '}
          {hiddenSections
            .map((section) => `${section.course.id} (${section.id})`)
            .join(', ')
            .trim()}
        </div>
      )}
    </div>
  );
}
