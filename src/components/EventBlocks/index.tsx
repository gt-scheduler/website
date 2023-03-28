import React, { ReactElement, useState, useContext, useRef } from 'react';
import { Immutable, castDraft } from 'immer';

import { daysToString, periodToString } from '../../utils/misc';
import { TimeBlocks } from '..';
import { Period, Event } from '../../types';
import { TimeBlockPosition, SizeInfo } from '../TimeBlocks';
import { CLOSE, OPEN } from '../../constants';
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
  capture: boolean;
  includeDetailsPopover: boolean;
  includeContent: boolean;
  sizeInfo: SizeInfo;
  canBeTabFocused?: boolean;
  deviceHasHover?: boolean;
  selectedMeeting?: [meetingIndex: number, day: string] | null;
  onSelectMeeting?: (
    meeting: [meetingIndex: number, day: string] | null
  ) => void;
  daysRef: React.RefObject<HTMLDivElement>;
  timesRef: React.RefObject<HTMLDivElement>;
};

export default function EventBlocks({
  className,
  event,
  capture,
  sizeInfo,
  includeDetailsPopover,
  includeContent,
  canBeTabFocused = false,
  deviceHasHover = true,
  selectedMeeting,
  onSelectMeeting,
  daysRef,
  timesRef,
}: EventBlocksProps): React.ReactElement | null {
  const [tempStart, setTempStart] = useState<number>(event.period.start);
  const [tempDays, setTempDays] = useState<string[]>([...event.days]);

  const tempStartRef = useRef<number>(event.period.start);
  const tempDaysRef = useRef<string[]>([...event.days]);

  const [dragging, setDragging] = useState<boolean>(false);
  const [theme] = useContext(ThemeContext);

  const [{ events }, { patchSchedule }] = useContext(ScheduleContext);

  const handleMouseDown = (
    e: React.MouseEvent,
    ref: React.RefObject<HTMLDivElement>
  ): void => {
    const cloneMeeting = ref.current!.cloneNode(true) as HTMLDivElement;
    cloneMeeting.classList.add('meeting--clone');
    cloneMeeting.id = 'meeting--clone';

    setDragging(true);

    ref.current?.classList.remove('light-content', 'dark-content');
    ref.current?.classList.add(`${theme}-content`);
    ref.current?.parentNode?.appendChild(cloneMeeting);
    ref.current?.classList.add('meeting--dragging');

    // eslint-disable-next-line
    const mouseMoveHandler = (e_: any): void => handleMouseMove(e_, ref);

    const handleMouseUp = (
      e_: React.MouseEvent,
      ref_: React.RefObject<HTMLDivElement>
    ): void => {
      ref_.current?.classList.remove('meeting--dragging');
      cloneMeeting.remove();
      setDragging(false);

      const newEvents = castDraft(events).map((existingEvent: Event) => {
        if (existingEvent.id === event.id) {
          return {
            ...existingEvent,
            period: {
              start: tempStartRef.current,
              end: tempStartRef.current + event.period.end - event.period.start,
            },
            days: tempDaysRef.current,
          };
        }
        return existingEvent;
      });

      patchSchedule({ events: newEvents });

      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', documentMouseUp);
    };

    // eslint-disable-next-line
    const documentMouseUp = (e_: any): void => handleMouseUp(e_, ref);

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', documentMouseUp);
  };

  const handleMouseMove = (
    e: React.MouseEvent,
    ref: React.RefObject<HTMLDivElement>
  ): void => {
    const start = Math.round(
      (Math.round(
        e.pageY -
          timesRef.current!.getBoundingClientRect().y -
          ref.current!.offsetHeight / 2
      ) /
        timesRef.current!.getBoundingClientRect().height) *
        (CLOSE - OPEN) +
        OPEN
    );
    const end = start + event.period.end - event.period.start;
    const left = e.pageX - daysRef.current!.getBoundingClientRect().x;
    const day = ['M', 'T', 'W', 'R', 'F'][
      Math.floor(
        ((left / daysRef.current!.getBoundingClientRect().width) * 100) / 20
      )
    ];
    if (day && event.days.length === 1) {
      ref.current!.classList.remove('M', 'T', 'W', 'R', 'F');
      ref.current!.classList.add(day);
      setTempDays([day]);
      tempDaysRef.current = [day];
    }

    if (start >= OPEN && end <= CLOSE) {
      setTempStart(start);
      tempStartRef.current = start;
    }
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
                    (tempStart ?? event.period.start) +
                    (event.period.end - event.period.start),
                }),
              },
            ]
          : []
      }
      popover={[
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
      ]}
      capture={capture}
      sizeInfo={sizeInfo}
      includeDetailsPopover={!dragging && includeDetailsPopover}
      includeContent={includeContent}
      canBeTabFocused={canBeTabFocused}
      deviceHasHover={deviceHasHover}
      handleMouseDown={handleMouseDown}
    />
  );
}
