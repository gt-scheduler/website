import React, { useState, useContext } from 'react';
import { Immutable } from 'immer';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';

import { daysToString, periodToString } from '../../utils/misc';
import { TimeBlocks } from '..';
import { Period, Event } from '../../types';
import { TimeBlockPosition, SizeInfo } from '../TimeBlocks';
import { CLOSE, OPEN, DAYS } from '../../constants';

import './stylesheet.scss';

import { ScheduleContext } from '../../contexts';

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
}: EventBlocksProps): React.ReactElement | null {
  const [{ events }, { patchSchedule }] = useContext(ScheduleContext);
  const [newPos, setNewPos] = useState({
    x:
      DAYS.indexOf(event.days[0]!) * 20 +
      sizeInfo[event.days[0]!]![`${event.period.start}-${event.period.end}`]!
        .rowIndex *
        (20 /
          sizeInfo[event.days[0]!]![
            `${event.period.start}-${event.period.end}`
          ]!.rowSize),
    y: ((event.period.start - OPEN) / (CLOSE - OPEN)) * 100,
  });

  const [eventPosInfo, setEventPosInfo] = useState({
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (
    dragEvent: DraggableEvent,
    info: DraggableData
  ): void => {
    console.log('drag start', info);
    setIsDragging(true);
    setEventPosInfo({
      ...eventPosInfo,
      x: info.x,
      y: info.y,
      lastX: info.lastX,
      lastY: info.lastY,
    });
  };

  const handleDrag = (dragEvent: DraggableEvent, info: DraggableData): void => {
    console.log('drag');
    setEventPosInfo({
      ...eventPosInfo,
      x: info.x,
      y: info.y,
      lastX: eventPosInfo.lastX,
      lastY: eventPosInfo.lastY,
    });
  };

  const handleDragStop = (
    dragEvent: DraggableEvent,
    info: DraggableData
  ): void => {
    console.log('drag stop');
    setIsDragging(false);
    setEventPosInfo({
      ...eventPosInfo,
      x: info.x,
      y: info.y,
      lastX: eventPosInfo.lastX,
      lastY: eventPosInfo.lastY,
    });

    console.log('Pos: ', eventPosInfo);
    // 60-70 = hour change
    // 50-60 = 45 min change
    // 30-40 = 30 min change
    // 20-30 = 15 min change

    if (
      eventPosInfo.lastY - eventPosInfo.y >= 60 &&
      eventPosInfo.lastY - eventPosInfo.y < 70
    ) {
      const start = (Math.ceil(newPos.y) / 100) * (CLOSE - OPEN) + OPEN;
      const time = start / 60;
      const newStartTime = time - 1;

      const updatedEvent = { ...event };
      // patchSchedule({ events: { updatedEvent } });

      // console.log('Works Up: ', Math.floor(newStartTime));
      // setNewPos({
      //   ...newPos,
      //   x: newPos.x,
      //   y: ((Math.floor(newStartTime) - OPEN) / (CLOSE - OPEN)) * 100,
      // });
    }
    // else if (info.y >= 60 && info.y < 70) {
    //   const start = (Math.ceil(newPos.y) / 100) * (CLOSE - OPEN) + OPEN;
    //   const time = start / 60;
    //   const newStartTime = time + 1;
    //   console.log('Works Down: ', Math.floor(newStartTime));
    //   setNewPos({
    //     ...newPos,
    //     x: newPos.x,
    //     y: ((Math.floor(newStartTime) - OPEN) / (CLOSE - OPEN)) * 100,
    //   });
    // }

    // console.log("NewPos: ", newPos.y);
  };

  // sizeInfo[event.days[0]!]![`${event.period.start}-${event.period.end}`]!.rowIndex

  return (
    <div
      className="draggable-main-container"
      style={{
        position: 'absolute',
        top: `${newPos.y}%`,
        // top: `${((event.period.start - OPEN) / (CLOSE - OPEN)) * 100}%`,
        height: `${
          (Math.max(15, event.period.end - event.period.start) /
            (CLOSE - OPEN)) *
          100
        }%`,
        width: `${
          20 /
          sizeInfo[event.days[0]!]![
            `${event.period.start}-${event.period.end}`
          ]!.rowSize
        }%`,
        left: `${
          DAYS.indexOf(event.days[0]!) * 20 +
          sizeInfo[event.days[0]!]![
            `${event.period.start}-${event.period.end}`
          ]!.rowIndex *
            (20 /
              sizeInfo[event.days[0]!]![
                `${event.period.start}-${event.period.end}`
              ]!.rowSize)
        }%`,
        borderWidth: isDragging ? 1 : 0,
        borderStyle: isDragging ? 'solid' : 'none',
        // borderColor: isDragging
        //   ? 'black'
        //   : 'white',
      }}
    >
      {isDragging ? (
        <div className="draggable-meeting-wrapper">
          <div className="ids">
            <span className={event.id}>{event.name}&nbsp;</span>
          </div>
          <span className={event.id}>
            {`${event.period.start / 60} - ${event.period.end / 60}`}&nbsp;
          </span>
        </div>
      ) : (
        <div />
      )}
      <Draggable
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
      >
        <div
          style={{
            position: 'absolute',
            top: `${((event.period.start - OPEN) / (CLOSE - OPEN)) * 100}%`,
            height: `${
              (Math.max(15, event.period.end - event.period.start) /
                (CLOSE - OPEN)) *
              100
            }%`,
            width: `${
              20 /
              sizeInfo[event.days[0]!]![
                `${event.period.start}-${event.period.end}`
              ]!.rowSize
            }%`,
            left: `${
              DAYS.indexOf(event.days[0]!) * 20 +
              sizeInfo[event.days[0]!]![
                `${event.period.start}-${event.period.end}`
              ]!.rowIndex *
                (20 /
                  sizeInfo[event.days[0]!]![
                    `${event.period.start}-${event.period.end}`
                  ]!.rowSize)
            }%`,
          }}
        >
          <TimeBlocks
            className={className}
            id={event.id}
            meetingIndex={1}
            period={event.period}
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
                      content: periodToString(event.period),
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
            includeDetailsPopover={includeDetailsPopover}
            includeContent={includeContent}
            canBeTabFocused={canBeTabFocused}
            deviceHasHover={deviceHasHover}
            selectedMeeting={selectedMeeting}
            onSelectMeeting={onSelectMeeting}
          />
        </div>
      </Draggable>
    </div>
  );
}
