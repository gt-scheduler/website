import React, { useContext, useId } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { useRootClose } from 'react-overlays';

import { classes, getContentClassName, periodToString } from '../../utils/misc';
import { CLOSE, OPEN, DAYS } from '../../constants';
import { ScheduleContext } from '../../contexts';
import { Meeting, Period } from '../../types';
import { Section } from '../../data/beans';

import './stylesheet.scss';

export interface TimeBlockPosition {
  rowIndex: number;
  rowSize: number;
  period: Period;
  crn: string;
}

export type SizeInfo = Record<string, Record<string, TimeBlockPosition>>;

export type TimeBlocksProps = {
  className?: string;
  crn: string;
  overlay?: boolean;
  capture: boolean;
  preview: boolean;
  isAutosized: boolean;
  sizeInfo: SizeInfo;
  /**
   * Passing through this prop to skip subscribing to a media query per
   * TimeBlocks component instance:
   */
  deviceHasHover?: boolean;
  /**
   * The index of the meeting and day to highlight. This will also cause the
   * details popover to remain open. If null/undefined, no meeting is
   * highlighted.
   */
  selectedMeeting?: [meetingIndex: number, day: string] | null;
  onSelectMeeting?: (
    meeting: [meetingIndex: number, day: string] | null
  ) => void;
};

export function makeSizeInfoKey(period: Period): string {
  return [period.start, period.end].join('-');
}

export default function TimeBlocks({
  className,
  crn,
  overlay = false,
  preview,
  capture,
  isAutosized,
  sizeInfo,
  deviceHasHover = true,
  selectedMeeting,
  onSelectMeeting,
}: TimeBlocksProps): React.ReactElement | null {
  const [{ oscar, colorMap }] = useContext(ScheduleContext);

  const section = oscar.findSection(crn);
  if (section == null) return null;

  const color = colorMap[section.course.id];

  return (
    <div
      className={classes(
        'TimeBlocks',
        capture && 'capture',
        overlay && 'overlay',
        className
      )}
    >
      {section.meetings.map((meeting, i) => {
        const { period } = meeting;
        if (period == null) return;

        const sizeInfoKey = makeSizeInfoKey(period);
        return meeting.days.map((day) => {
          const sizeInfoDay = sizeInfo[day];
          if (sizeInfoDay == null) return;
          const sizeInfoPeriodDay = sizeInfoDay[sizeInfoKey];
          if (sizeInfoPeriodDay == null) return;

          return (
            <MeetingDayBlock
              color={color}
              day={day}
              period={period}
              section={section}
              meeting={meeting}
              sizeInfo={sizeInfoPeriodDay}
              includeDetailsPopover={!isAutosized}
              includeContent={!preview}
              isSelected={
                selectedMeeting != null &&
                selectedMeeting[0] === i &&
                selectedMeeting[1] === day
              }
              onSelect={(newIsSelected: boolean): void => {
                if (onSelectMeeting == null) return;
                if (newIsSelected) {
                  onSelectMeeting([i, day]);
                } else {
                  onSelectMeeting(null);
                }
              }}
              key={`${day}-${sizeInfoKey}`}
              deviceHasHover={deviceHasHover}
            />
          );
        });
      })}
    </div>
  );
}

type MeetingDayBlockProps = {
  color: string | undefined;
  day: string;
  period: Period;
  section: Section;
  meeting: Meeting;
  sizeInfo: TimeBlockPosition;
  includeDetailsPopover: boolean;
  includeContent: boolean;
  isSelected: boolean;
  onSelect: (newIsSelected: boolean) => void;
  deviceHasHover: boolean;
};

function MeetingDayBlock({
  color,
  day,
  period,
  section,
  meeting,
  sizeInfo,
  includeDetailsPopover,
  includeContent,
  isSelected,
  onSelect,
  deviceHasHover,
}: MeetingDayBlockProps): React.ReactElement {
  const tooltipId = useId();
  const contentClassName = getContentClassName(color);
  const outerRef = React.useRef<HTMLDivElement>(null);
  const handleRootClose = (): void => {
    if (isSelected) onSelect(false);
  };
  useRootClose(outerRef, handleRootClose, {
    disabled: !isSelected,
  });

  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <div ref={outerRef}>
      <div
        className={classes(
          'meeting',
          contentClassName,
          'default',
          day,
          isSelected && 'meeting--selected'
        )}
        style={{
          top: `${((period.start - OPEN) / (CLOSE - OPEN)) * 100}%`,
          height: `${((period.end - period.start) / (CLOSE - OPEN)) * 100}%`,
          width: `${20 / sizeInfo.rowSize}%`,
          left: `${
            DAYS.indexOf(day) * 20 + sizeInfo.rowIndex * (20 / sizeInfo.rowSize)
          }%`,
          ...({
            '--meeting-color': color,
          } as React.CSSProperties),
        }}
        id={tooltipId}
        onClick={(e: React.MouseEvent): void => {
          e.stopPropagation();
          onSelect(!isSelected);
        }}
        onFocus={(e: React.FocusEvent): void => {
          e.stopPropagation();
          onSelect(true);
        }}
        onBlur={(e: React.FocusEvent): void => {
          e.stopPropagation();
          onSelect(false);
        }}
      >
        {includeContent && (
          <div className="meeting-wrapper">
            <div className="ids">
              <span className="course-id">{section.course.id}</span>
              <span className="section-id">&nbsp;{section.id}</span>
            </div>
            <span className="period">{periodToString(period)}</span>
            <span className="where">{meeting.where}</span>
            <span className="instructors">
              {meeting.instructors.join(', ')}
            </span>
          </div>
        )}
      </div>
      {/* Include a details popover that can be opened by either:
      - hovering over the meeting, on devices with hover. This opens a
        "preview", which has less opacity.
      - clicking, tapping, or focusing on the meeting. This "selects" it,
        shows the popover with more opacity, and adds a selection 'halo' around
        the meeting block itself. */}
      {includeDetailsPopover && (
        <ReactTooltip
          anchorId={tooltipId}
          className="tooltip"
          variant="dark"
          place="top"
          clickable
          isOpen={isSelected || isHovered}
          setIsOpen={setIsHovered}
          delayShow={20}
          delayHide={100}
          // HACK: ReactTooltip can't handle changing the `events` prop, so we
          // need to force a remount when the `deviceHasHover` prop changes.
          // This probably won't happen often in the wild, but it's noticeable
          // when debugging in devtools:
          key={deviceHasHover ? 0 : 1}
          // Disable the hover event if the device doesn't support it, since
          // clicks are handled separately and present a better UX.
          // Without this, the hover event will be triggered in the same way as
          // clicks, which is redundant. Moreover, upon loosing focus on mobile,
          // the "delayHide" causes the tooltip to remain open for a small
          // amount of time which is noticeable, especially because the
          // "selected" styles stop applying while the tooltip is still open.
          events={deviceHasHover ? ['hover'] : []}
        >
          <DetailsPopoverContent
            title={section.course.title}
            instructors={meeting.instructors}
            location={meeting.where}
            crn={section.crn}
            credits={section.credits}
            deliveryMode={section.deliveryMode ?? null}
          />
        </ReactTooltip>
      )}
    </div>
  );
}

type DetailsPopoverContentProps = {
  title: string;
  instructors: string[];
  location: string;
  crn: string;
  credits: number;
  deliveryMode: string | null;
};

function DetailsPopoverContent({
  title,
  instructors,
  location,
  crn,
  credits,
  deliveryMode,
}: DetailsPopoverContentProps): React.ReactElement {
  return (
    <table>
      <tbody>
        <tr>
          <td>
            <b>Course Name</b>
          </td>
          <td>{title}</td>
        </tr>
        <tr>
          <td>
            <b>Instructors</b>
          </td>
          <td>{instructors.join(', ')}</td>
        </tr>
        <tr>
          <td>
            <b>Location</b>
          </td>
          <td>{location}</td>
        </tr>
        <tr>
          <td>
            <b>CRN</b>
          </td>
          <td>{crn}</td>
        </tr>
        <tr>
          <td>
            <b>Credit Hours</b>
          </td>
          <td>{credits}</td>
        </tr>
        {deliveryMode && (
          <tr>
            <td>
              <b>Delivery Type</b>
            </td>
            <td>{deliveryMode}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
