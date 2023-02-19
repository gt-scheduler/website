import React from 'react';

import { daysToString, periodToString } from '../../utils/misc';
import { TimeBlocks } from '..';
import { Period, Event } from '../../types';
import { TimeBlockPosition, SizeInfo } from '../TimeBlocks';

import './stylesheet.scss';

export interface EventBlockPosition extends TimeBlockPosition {
  rowIndex: number;
  rowSize: number;
  period: Period;
  id: string;
}

export type EventBlocksProps = {
  className?: string;
  event: Event;
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
  return (
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
  );
}
