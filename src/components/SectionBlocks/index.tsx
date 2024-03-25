import React, { useContext } from 'react';

import { abbreviateLocation, periodToString } from '../../utils/misc';
import { ScheduleContext } from '../../contexts';
import { Period } from '../../types';
import { TimeBlocks } from '..';
import { TimeBlockPosition, SizeInfo } from '../TimeBlocks';

import './stylesheet.scss';

export interface SectionBlockPosition extends TimeBlockPosition {
  rowIndex: number;
  rowSize: number;
  period: Period;
  crn: string;
}

export type SectionBlocksProps = {
  className?: string;
  crn: string;
  schedule?: string;
  overlay?: boolean;
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

export default function SectionBlocks({
  className,
  crn,
  schedule,
  overlay = false,
  capture,
  sizeInfo,
  includeDetailsPopover,
  includeContent,
  canBeTabFocused = false,
  deviceHasHover = true,
  selectedMeeting,
  onSelectMeeting,
}: SectionBlocksProps): React.ReactElement | null {
  const [{ oscar }] = useContext(ScheduleContext);

  const section = oscar.findSection(crn);
  if (section == null) return null;

  return (
    <div>
      {section.meetings.map((meeting, i) => {
        const { period } = meeting;
        if (period == null) return;

        return (
          <TimeBlocks
            key={`${section.course.id}-${section.id}-${i}`}
            className={className}
            id={section.course.id}
            meetingIndex={i}
            period={period}
            days={meeting.days.filter((day) => day !== 'S' && day !== 'U')}
            contentHeader={[
              {
                className: 'course-id',
                content: section.course.id,
              },
              {
                className: 'section-id',
                content: section.id,
              },
            ]}
            contentBody={[
              {
                className: 'period',
                content: periodToString(period),
              },
              {
                className: 'where',
                content: abbreviateLocation(meeting.where),
              },
              {
                className: 'instructors',
                content: meeting.instructors.join(', '),
              },
            ]}
            popover={[
              {
                name: 'Course Name',
                content: section.course.title,
              },
              {
                name: 'Instructors',
                content: meeting.instructors.join(', ') || 'TBA',
              },
              {
                name: 'Location',
                content: meeting.where,
              },
              {
                name: 'CRN',
                content: section.crn,
              },
              {
                name: 'Credit Hours',
                content: section.credits.toString(),
              },
              {
                name: 'Delivery Type',
                content: section.deliveryMode ?? undefined,
              },
            ]}
            overlay={overlay}
            capture={capture}
            sizeInfo={sizeInfo}
            includeDetailsPopover={includeDetailsPopover}
            includeContent={includeContent}
            canBeTabFocused={canBeTabFocused}
            deviceHasHover={deviceHasHover}
            selectedMeeting={selectedMeeting}
            onSelectMeeting={onSelectMeeting}
            schedule={schedule}
          />
        );
      })}
    </div>
  );
}
