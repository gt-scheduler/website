import React, { MouseEventHandler, useState } from 'react';
import { Immutable } from 'immer';
import Draggable, {
  DraggableCore,
  DraggableData,
  DraggableEvent,
} from 'react-draggable';

import { daysToString, periodToString } from '../../utils/misc';
import { TimeBlocks } from '..';
import { Period, Event } from '../../types';
import { TimeBlockPosition, SizeInfo } from '../TimeBlocks';
import { CLOSE, OPEN, DAYS } from '../../constants';

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
  const [newPos, setNewPos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleDragStart = (
    dragEvent: DraggableEvent,
    info: DraggableData
  ): void => {
    console.log('drag start', info);
    // setNewPos({ ...newPos, x: info.deltaX, y: info.deltaY });
    // console.log('New Pos: ', newPos);
    // console.log('Days: ', event.days);
    // console.log('SizeInfo: ', sizeInfo);
  };

  const handleMouseMovement = (
    mouse: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    setMousePos({ ...mousePos, x: mouse.clientX, y: mouse.clientY });
  };

  const handleDrag = (dragEvent: DraggableEvent, info: DraggableData): void => {
    console.log('drag');
    setNewPos({ ...newPos, x: mousePos.x, y: mousePos.y });
    if (document.getElementById(event.id) != null) {
      document.getElementById(event.id)!.style.translate =
        '(newPos.x, newPos.y)';
    }
  };

  const handleDragStop = (
    dragEvent: DraggableEvent,
    info: DraggableData
  ): void => {
    // console.log('drag stop');
    setNewPos({ ...newPos, x: info.lastX, y: info.lastY });
  };

  // sizeInfo[event.days[0]!]![`${event.period.start}-${event.period.end}`]!.rowIndex

  return (
    <DraggableCore
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
    >
      <div
        id="TEST"
        onMouseMove={handleMouseMovement}
        // style={{
        //   top: `${((event.period.start - OPEN) / (CLOSE - OPEN)) * 100}%`,
        //   height: `${(Math.max(15, event.period.end - event.period.start) / (CLOSE - OPEN)) * 100
        //     }%`,
        //   width: `${20 / sizeInfo[event.days[0]!]![`${event.period.start}-${event.period.end}`]!.rowSize}%`,
        //   left: `${DAYS.indexOf(event.days[0]!) * 20 + sizeInfo[event.days[0]!]![`${event.period.start}-${event.period.end}`]!.rowIndex * (20 / sizeInfo[event.days[0]!]![`${event.period.start}-${event.period.end}`]!.rowSize)
        //     }%`,
        //   // ...({
        //   //   '--meeting-color': color,
        //   // } as React.CSSProperties),
        // }}
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
    </DraggableCore>

    // <div className="TEST"
    //   draggable
    // // onDragStart={handleDragStart}
    // // onDrag={handleDrag}
    // // onDragEnd={handleDragStop}
    // >
    //   <TimeBlocks
    //     className={className}
    //     id={event.id}
    //     meetingIndex={1}
    //     period={event.period}
    //     days={event.days}
    //     contentHeader={[
    //       {
    //         className: 'event-name',
    //         content: event.name,
    //       },
    //     ]}
    //     contentBody={
    //       event.period.end - event.period.start >= 30
    //         ? [
    //           {
    //             className: 'period',
    //             content: periodToString(event.period),
    //           },
    //         ]
    //         : []
    //     }
    //     popover={[
    //       {
    //         name: 'Name',
    //         content: event.name,
    //       },
    //       {
    //         name: 'Time',
    //         content: [
    //           daysToString(event.days),
    //           periodToString(event.period),
    //         ].join(' '),
    //       },
    //     ]}
    //     capture={capture}
    //     sizeInfo={sizeInfo}
    //     includeDetailsPopover={includeDetailsPopover}
    //     includeContent={includeContent}
    //     canBeTabFocused={canBeTabFocused}
    //     deviceHasHover={deviceHasHover}
    //     selectedMeeting={selectedMeeting}
    //     onSelectMeeting={onSelectMeeting}
    //   />
    // </div>
  );
}
