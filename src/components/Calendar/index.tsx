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

type BlockPosition = SectionBlockPosition | EventBlockPosition;

type MeetingSizeInfo = Record<
  string,
  Record<string, Record<string, BlockPosition>>
>;

function blockKey(block: BlockPosition): string {
  return 'crn' in block ? block.crn : block.id;
}

/**
 * Lays out every block of a single day into columns.
 *
 * Blocks are first split into "joined groups": maximal runs of blocks that are
 * connected to each other by overlapping in time. Each block then takes the
 * leftmost column that is free at the moment it starts, and every block of a
 * joined group is finally given the same `rowSize` — the number of columns
 * that group needed, which for time intervals is exactly the largest number of
 * blocks that are ever concurrent within it.
 *
 * The effect is that a set of blocks that overlap each other always divides
 * the day column evenly between them, with no empty column left between or
 * beside them: two people busy at the same time each get half the column,
 * however many other (non-concurrent) blocks that day happens to contain.
 */
function packDayBlocks(blocks: BlockPosition[]): void {
  // Earliest start first, so a column is only ever reused by a block that
  // starts after its previous occupant ends. Ties are broken deterministically
  // so the layout does not depend on the order schedules were merged in.
  const sorted = [...blocks].sort(
    (a, b) =>
      a.period.start - b.period.start ||
      a.period.end - b.period.end ||
      blockKey(a).localeCompare(blockKey(b))
  );

  // The end time of the last block placed in each column of the current group.
  let columnEnds: number[] = [];
  let group: BlockPosition[] = [];
  // The latest end time seen in the current group: a block starting at or
  // after it cannot overlap anything already placed, so it starts a new group.
  let groupEnd = -Infinity;

  const closeGroup = (): void => {
    group.forEach((block) => {
      block.rowSize = columnEnds.length;
    });
    columnEnds = [];
    group = [];
    groupEnd = -Infinity;
  };

  sorted.forEach((block) => {
    if (block.period.start >= groupEnd) closeGroup();

    let column = columnEnds.findIndex((end) => end <= block.period.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(block.period.end);
    } else {
      columnEnds[column] = block.period.end;
    }

    block.rowIndex = column;
    group.push(block);
    groupEnd = Math.max(groupEnd, block.period.end);
  });

  closeGroup();
}

/**
 * Populates `meetingSizeInfo` for compare mode, where the blocks of every
 * person shown (the current user included) are packed together, one group per
 * day, by `packDayBlocks`.
 */
function packMeetingsCompare(
  meetings: CommonMeetingObject[],
  meetingSizeInfo: MeetingSizeInfo
): void {
  const blocksByDay: Record<string, BlockPosition[]> = {};

  meetings.forEach((meeting) => {
    const { period } = meeting;
    if (period == null) return;

    meeting.days.forEach((day) => {
      const mSizeInfo = meetingSizeInfo[meeting.id] ?? {};
      meetingSizeInfo[meeting.id] = mSizeInfo;

      const daySizeInfo = mSizeInfo[day] ?? {};
      mSizeInfo[day] = daySizeInfo;

      // The exact same block can be contributed more than once — e.g. when a
      // single schedule version is accessible through two people and is
      // therefore overlaid once per person. It is rendered on top of itself
      // either way, so it must only ever take a single column.
      const key = makeSizeInfoKey(period);
      if (daySizeInfo[key] != null) return;

      const block: BlockPosition = meeting.event
        ? { period, id: meeting.id, rowIndex: 0, rowSize: 1 }
        : { period, crn: meeting.id, rowIndex: 0, rowSize: 1 };
      daySizeInfo[key] = block;

      const dayBlocks = blocksByDay[day] ?? [];
      blocksByDay[day] = dayBlocks;
      dayBlocks.push(block);
    });
  });

  Object.values(blocksByDay).forEach(packDayBlocks);
}

/**
 * Populates `meetingSizeInfo` the way the regular (non-compare) calendar has
 * always done: each block is given a brand new column, one wider than the
 * widest already-placed block it overlaps, and that width is then pushed onto
 * every block connected to it. Kept as-is so the Scheduler tab's layout is
 * untouched by the compare-mode packing above.
 */
function packMeetingsLegacy(
  meetings: CommonMeetingObject[],
  meetingSizeInfo: MeetingSizeInfo
): void {
  // Recursively sets the rowSize of all time blocks within the current
  // connected grouping of blocks to the current block's rowSize
  const updateJoinedRowSizes = (
    periodInfos: BlockPosition[],
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
          blockKey(period2Info),
          period2Info.period,
          newRowSize
        );
      });
  };

  // Populates crnSizeInfo and eventSizeInfo by iteratively finding the
  // next time block's rowSize and rowIndex (1 more than
  // greatest of already processed connected blocks), updating
  // the processed connected blocks to match its rowSize
  meetings.forEach((meeting) => {
    const { period } = meeting;
    if (period == null) return;

    meeting.days.forEach((day) => {
      const dayPeriodInfos = Object.values(meetingSizeInfo)
        .flatMap<BlockPosition | undefined>((days) =>
          days != null ? Object.values(days[day] ?? {}) : []
        )
        .flatMap<BlockPosition>((info) => (info == null ? [] : [info]));

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
}

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
  const meetingSizeInfo: MeetingSizeInfo = {};

  const daysRef = React.useRef<HTMLDivElement>(null);
  const timesRef = React.useRef<HTMLDivElement>(null);
  const calendarRef = React.useRef<HTMLDivElement>(null);

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

  // Compare mode draws several people at once, so all of their blocks — the
  // current user's sections and events included — are packed together, one
  // group per day, and any set of overlapping blocks splits its day column
  // evenly. Outside compare mode the calendar only ever draws one schedule,
  // and keeps its original packing.
  if (compare) {
    packMeetingsCompare(meetings, meetingSizeInfo);
  } else {
    packMeetingsLegacy(meetings, meetingSizeInfo);
  }

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
