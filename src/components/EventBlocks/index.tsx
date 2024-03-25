import React, { useState, useContext, useRef, useEffect } from 'react';
import { Immutable, castDraft } from 'immer';

import { daysToString, periodToString } from '../../utils/misc';
import { TimeBlocks } from '..';
import { Period, Event } from '../../types';
import { TimeBlockPosition, SizeInfo } from '../TimeBlocks';
import { CLOSE, OPEN, DAYS } from '../../constants';
import { ThemeContext, ScheduleContext } from '../../contexts';

import './stylesheet.scss';

export interface EventBlockPosition extends TimeBlockPosition {
  rowIndex: number;
  rowSize: number;
  period: Period;
  id: string;
}

export type EventBlocksProps = {
  className?: string;
  event: Immutable<Event>;
  owner?: string;
  scheduleName?: string;
  scheduleId?: string;
  overlay?: boolean;
  capture: boolean;
  includeDetailsPopover: boolean;
  includeContent: boolean;
  sizeInfo: SizeInfo;
  canBeTabFocused?: boolean;
  deviceHasHover?: boolean;
  daysRef?: React.RefObject<HTMLDivElement>;
  timesRef?: React.RefObject<HTMLDivElement>;
  selectedMeeting?: [meetingIndex: number, day: string] | null;
  onSelectMeeting?: (
    meeting: [meetingIndex: number, day: string] | null
  ) => void;
};

export default function EventBlocks({
  className,
  event,
  owner,
  scheduleName,
  scheduleId,
  overlay = false,
  capture,
  sizeInfo,
  includeDetailsPopover,
  includeContent,
  canBeTabFocused = false,
  deviceHasHover = true,
  daysRef,
  timesRef,
  selectedMeeting,
  onSelectMeeting,
}: EventBlocksProps): React.ReactElement | null {
  const popover = scheduleName
    ? [
        {
          name: 'Owner',
          content: owner,
        },
        {
          name: 'Schedule',
          content: scheduleName,
        },
      ]
    : [];
  const [tempStart, setTempStart] = useState<number>(event.period.start);

  // Store these in refs since the event handlers won't be re generated
  // once the event handlers are set inside handleMouseDown
  const tempStartRef = useRef<number>(event.period.start);
  const tempDaysRef = useRef<string[]>([...event.days]);

  useEffect(() => {
    setTempStart(event.period.start);
  }, [event.period.start]);

  // Save original style of the block
  const savedStyleRef = useRef<string>();
  const savedClassListRef = useRef<string>();

  const [dragging, setDragging] = useState<boolean>(false);
  const [theme] = useContext(ThemeContext);

  const [{ events }, { patchSchedule }] = useContext(ScheduleContext);

  // Start dragging a block. This event handler is passed down to each block
  const handleMouseDown = (
    e: React.MouseEvent,
    ref: React.RefObject<HTMLDivElement>
  ): void => {
    if (!ref.current) return;
    if (!deviceHasHover) return;
    // Save style of the block
    savedStyleRef.current = ref.current.style.cssText;
    savedClassListRef.current = ref.current.className;

    // Create a clone of the block to take the original blocks place
    const cloneMeeting = ref.current.cloneNode(true) as HTMLDivElement;
    cloneMeeting.classList.add('meeting--clone');
    cloneMeeting.id = 'meeting--clone';

    setDragging(true);

    // Reset some of the block styling to account for theme and add
    // dragging class
    if (ref.current) {
      ref.current.classList.remove('light-content', 'dark-content');
      ref.current.classList.add(`${theme}-content`);
      ref.current.parentNode?.appendChild(cloneMeeting);
      ref.current.classList.add('meeting--dragging');
      ref.current.style.width = '20%';
    }

    // Disabled eslint because it doesn't like the parameter
    // eslint-disable-next-line
    const mouseMoveHandler = (e_: MouseEvent): void => handleMouseMove(e_, ref);

    const handleMouseUp = (
      e_: MouseEvent,
      ref_: React.RefObject<HTMLDivElement>
    ): void => {
      if (!ref_.current) return;
      ref_.current.className = savedClassListRef.current || '';
      ref_.current.style.cssText = savedStyleRef.current || '';

      cloneMeeting.remove();

      setDragging(false);

      // Update the event time in firestore/local storage once done dragging
      const newEvents = castDraft(events).map((existingEvent: Event) => {
        if (existingEvent.id === event.id) {
          return {
            ...existingEvent,
            period: {
              start: tempStartRef.current,
              end: tempStartRef.current + event.period.end - event.period.start,
            },
            days:
              event.days.length === 1 ? tempDaysRef.current : [...event.days],
          };
        }
        return existingEvent;
      });

      patchSchedule({ events: newEvents });

      // Clean up the event listeners once done dragging
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', documentMouseUp);
    };

    // eslint-disable-next-line
    const documentMouseUp = (e_: any): void => handleMouseUp(e_, ref);

    // Add event listeners to enable dragging
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', documentMouseUp);
  };

  // Calculates and updates the position of the block while dragging
  const handleMouseMove = (
    e: MouseEvent,
    ref: React.RefObject<HTMLDivElement>
  ): void => {
    if (!ref.current || !timesRef?.current || !daysRef?.current) return;

    // math which calculates the new start time by calculating mouse
    // position proportional to calendar size, then we find new time
    // by rounding to nearest 5
    let start =
      Math.round(
        ((Math.round(
          e.pageY -
            timesRef.current.getBoundingClientRect().y -
            ref.current.offsetHeight / 2
        ) /
          timesRef.current.getBoundingClientRect().height) *
          (CLOSE - OPEN) +
          OPEN) /
          5
      ) * 5;
    const end = start + event.period.end - event.period.start;
    const left = e.pageX - daysRef.current.getBoundingClientRect().x;
    const day =
      DAYS[
        Math.floor(
          ((left / daysRef.current.getBoundingClientRect().width) * 100) / 20
        )
      ];
    if (day && event.days.length === 1) {
      ref.current.style.left = `${DAYS.indexOf(day) * 20}%`;
      tempDaysRef.current = [day];
    }

    if (start < OPEN) {
      start = OPEN;
    } else if (end > CLOSE) {
      start = CLOSE - (event.period.end - event.period.start);
    }

    setTempStart(start);
    tempStartRef.current = start;
  };

  return (
    <TimeBlocks
      className={className}
      id={event.id}
      meetingIndex={1}
      period={event.period}
      tempStart={tempStart}
      days={event.days}
      contentHeader={[
        {
          className: 'event-name',
          content: event.name,
        },
      ]}
      contentBody={
        event.period.end - event.period.start >= 30
          ? [
              {
                className: 'period',
                content: periodToString({
                  start: tempStart ?? event.period.start,
                  end:
                    (tempStartRef.current ?? event.period.start) +
                    (event.period.end - event.period.start),
                }),
              },
            ]
          : []
      }
      popover={popover.concat([
        {
          name: 'Name',
          content: event.name,
        },
        {
          name: 'Time',
          content: [
            daysToString(event.days),
            periodToString(event.period),
          ].join(' '),
        },
      ])}
      overlay={overlay}
      capture={capture}
      sizeInfo={sizeInfo}
      includeDetailsPopover={!dragging && includeDetailsPopover}
      includeContent={includeContent}
      canBeTabFocused={canBeTabFocused}
      onSelectMeeting={onSelectMeeting}
      schedule={scheduleId}
      selectedMeeting={selectedMeeting}
      deviceHasHover={deviceHasHover}
      handleMouseDown={handleMouseDown}
    />
  );
}
