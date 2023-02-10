import React, { useContext, useId } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { useRootClose } from 'react-overlays';

import { classes, getContentClassName, periodToString } from '../../utils/misc';
import { CLOSE, OPEN, DAYS } from '../../constants';
import { ScheduleContext } from '../../contexts';
import { Meeting, Period, Event } from '../../types';
import { Section } from '../../data/beans';

import './stylesheet.scss';

export interface EventBlockPosition {
  rowIndex: number;
  rowSize: number;
  period: Period;
}

export type SizeInfo = Record<string, Record<string, EventBlockPosition>>;

export type EventBlocksProps = {
  event: Event;
  capture: boolean;
  includeDetailsPopover: boolean;
  includeContent: boolean;
  sizeInfo: SizeInfo;
  canBeTabFocused?: boolean;
  /**
   * Passing through this prop to skip subscribing to a media query per
   * EventBlocks component instance:
   */
  deviceHasHover?: boolean;
  /**
   * The index of the meeting and day to highlight. This will also cause the
   * details popover to remain open. If null/undefined, no meeting is
   * highlighted.
   */
  selectedMeeting?: string | null;
  onSelectMeeting?: (meeting: string | null) => void;
};

export function makeSizeInfoKey(period: Period): string {
  return [period.start, period.end].join('-');
}

export default function EventBlocks({
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
  const [{ oscar, colorMap }] = useContext(ScheduleContext);

  const color = colorMap[event.id];

  const sizeInfoKey = makeSizeInfoKey(event.period);

  return (
    <div className={classes('EventBlocks', capture && 'capture')}>
      {event.days.map((day, i) => {
        const sizeInfoDay = sizeInfo[day];
        if (sizeInfoDay == null) return;
        const sizeInfoPeriodDay = sizeInfoDay[sizeInfoKey];
        if (sizeInfoPeriodDay == null) return;

        return (
          <MeetingDayBlock
            color={color}
            day={day}
            name={event.name}
            period={event.period}
            days={event.days}
            sizeInfo={sizeInfoPeriodDay}
            includeDetailsPopover={includeDetailsPopover}
            includeContent={includeContent}
            isSelected={selectedMeeting != null && selectedMeeting === day}
            onSelect={(newIsSelected: boolean): void => {
              if (onSelectMeeting == null) return;
              if (newIsSelected) {
                onSelectMeeting(day);
              } else {
                onSelectMeeting(null);
              }
            }}
            key={`${day}-${sizeInfoKey}`}
            deviceHasHover={deviceHasHover}
            // Only the first day for a meeting can be tab focused
            canBeTabFocused={canBeTabFocused && i === 0}
          />
        );
      })}
      ;
    </div>
  );
}

type MeetingDayBlockProps = {
  color: string | undefined;
  day: string;
  name: string;
  period: Period;
  days: string[];
  sizeInfo: EventBlockPosition;
  canBeTabFocused: boolean;
  includeDetailsPopover: boolean;
  includeContent: boolean;
  isSelected: boolean;
  onSelect: (newIsSelected: boolean) => void;
  deviceHasHover: boolean;
};

function MeetingDayBlock({
  color,
  day,
  name,
  period,
  days,
  sizeInfo,
  canBeTabFocused = false,
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
  const BlockElement = canBeTabFocused ? 'button' : 'div';
  return (
    <div ref={outerRef}>
      <BlockElement
        className={classes(
          'meeting',
          contentClassName,
          'default',
          day,
          isSelected && 'meeting--selected'
        )}
        style={{
          top: `${((period.start - OPEN) / (CLOSE - OPEN)) * 100}%`,
          height: `${
            (Math.max(15, period.end - period.start) / (CLOSE - OPEN)) * 100
          }%`,
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
          onSelect(true);
        }}
        onFocus={
          canBeTabFocused
            ? (e: React.FocusEvent): void => {
                e.stopPropagation();
                setIsHovered(true);
              }
            : undefined
        }
        onBlur={
          canBeTabFocused
            ? (e: React.FocusEvent): void => {
                e.stopPropagation();
                setIsHovered(false);
              }
            : undefined
        }
        tabIndex={canBeTabFocused ? 0 : -1}
      >
        {includeContent && (
          <div className="meeting-wrapper">
            <div className="ids">
              <span className="course-id">{name}</span>
            </div>
            <span className="period">{periodToString(period)}</span>
          </div>
        )}
      </BlockElement>
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
          <DetailsPopoverContent name={name} period={period} days={days} />
        </ReactTooltip>
      )}
    </div>
  );
}

type DetailsPopoverContentProps = {
  name: string;
  period: Period;
  days: string[];
};

function DetailsPopoverContent({
  name,
  period,
  days,
}: DetailsPopoverContentProps): React.ReactElement {
  return (
    <table>
      <tbody>
        <tr>
          <td>
            <b>Name</b>
          </td>
          <td>{name}</td>
        </tr>
        <tr>
          <td>
            <b>Time</b>
          </td>
          <td>{[days.join(''), periodToString(period)].join(' ')}</td>
        </tr>
      </tbody>
    </table>
  );
}
