import React, { useContext, useId } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { useRootClose } from 'react-overlays';

import { classes, getContentClassName } from '../../utils/misc';
import { CLOSE, OPEN, DAYS } from '../../constants';
import { ScheduleContext } from '../../contexts';
import { Period } from '../../types';

import './stylesheet.scss';

export interface TimeBlockPosition {
  rowIndex: number;
  rowSize: number;
  period: Period;
}

export type TimeBlockContent = {
  className: string;
  content: string;
};

export type TimeBlockPopover = {
  name: string;
  content?: string;
};

export type SizeInfo = Record<string, Record<string, TimeBlockPosition>>;

export type TimeBlocksProps = {
  className?: string;
  id: string;
  meetingIndex: number;
  period: Period;
  tempStart?: number;
  days: string[] | readonly string[];
  contentHeader: TimeBlockContent[];
  contentBody: TimeBlockContent[];
  popover: TimeBlockPopover[];
  overlay?: boolean;
  capture: boolean;
  includeDetailsPopover: boolean;
  includeContent: boolean;
  sizeInfo: SizeInfo;
  canBeTabFocused?: boolean;
  schedule?: string;
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
  handleMouseDown?: (
    e: React.MouseEvent,
    ref: React.RefObject<HTMLDivElement>
  ) => void;
};

export function makeSizeInfoKey(period: Period): string {
  return [period.start, period.end].join('-');
}

export default function TimeBlocks({
  className,
  id,
  meetingIndex,
  period,
  tempStart,
  days,
  contentHeader,
  contentBody,
  popover,
  overlay = false,
  capture,
  sizeInfo,
  includeDetailsPopover,
  includeContent,
  canBeTabFocused = false,
  deviceHasHover = true,
  selectedMeeting,
  onSelectMeeting,
  schedule,
  handleMouseDown,
}: TimeBlocksProps): React.ReactElement | null {
  const [{ colorMap }] = useContext(ScheduleContext);
  const color = colorMap[schedule ?? id];
  const sizeInfoKey = makeSizeInfoKey(period);

  return (
    <div
      className={classes(
        'TimeBlocks',
        capture && 'capture',
        overlay && 'overlay',
        className
      )}
    >
      {days.map((day, i) => {
        const sizeInfoDay = sizeInfo[day];
        if (sizeInfoDay == null) return;
        const sizeInfoPeriodDay = sizeInfoDay[sizeInfoKey];
        if (sizeInfoPeriodDay == null) return;

        return (
          <MeetingDayBlock
            color={color}
            day={day}
            period={period}
            tempStart={tempStart}
            contentHeader={contentHeader}
            contentBody={contentBody}
            popover={popover}
            sizeInfo={sizeInfoPeriodDay}
            includeDetailsPopover={includeDetailsPopover}
            includeContent={includeContent}
            isSelected={
              selectedMeeting != null &&
              selectedMeeting[0] === meetingIndex &&
              selectedMeeting[1] === day
            }
            onSelect={(newIsSelected: boolean): void => {
              if (onSelectMeeting == null) return;
              if (newIsSelected) {
                onSelectMeeting([meetingIndex, day]);
              } else {
                onSelectMeeting(null);
              }
            }}
            key={`${day}-${sizeInfoKey}`}
            deviceHasHover={deviceHasHover}
            // Only the first day for a meeting can be tab focused
            canBeTabFocused={canBeTabFocused && i === 0}
            handleMouseDown={handleMouseDown}
          />
        );
      })}
    </div>
  );
}

type MeetingDayBlockProps = {
  color: string | undefined;
  day: string;
  period: Period;
  tempStart?: number;
  contentHeader: TimeBlockContent[];
  contentBody: TimeBlockContent[];
  popover: TimeBlockPopover[];
  sizeInfo: TimeBlockPosition;
  canBeTabFocused: boolean;
  includeDetailsPopover: boolean;
  includeContent: boolean;
  isSelected: boolean;
  onSelect: (newIsSelected: boolean) => void;
  deviceHasHover: boolean;
  handleMouseDown?: (
    e: React.MouseEvent,
    ref: React.RefObject<HTMLDivElement>
  ) => void;
};

function MeetingDayBlock({
  color,
  day,
  period,
  tempStart,
  contentHeader,
  contentBody,
  popover,
  sizeInfo,
  canBeTabFocused = false,
  includeDetailsPopover,
  includeContent,
  isSelected,
  onSelect,
  deviceHasHover,
  handleMouseDown,
}: MeetingDayBlockProps): React.ReactElement {
  const tooltipId = useId();
  const contentClassName = getContentClassName(color);
  const outerRef = React.useRef<HTMLDivElement>(null);
  const blockElementRef = React.useRef(null);
  const handleRootClose = (): void => {
    if (isSelected) onSelect(false);
  };
  useRootClose(outerRef, handleRootClose, {
    disabled: !isSelected,
  });
  const duration = period.end - period.start;
  const isDraft = color === undefined;
  const [isHovered, setIsHovered] = React.useState(false);
  const BlockElement = canBeTabFocused ? 'button' : 'div';

  return (
    <div ref={outerRef}>
      <BlockElement
        className={classes(
          'meeting',
          contentClassName,
          'default',
          // day,
          isSelected && 'meeting--selected'
        )}
        style={{
          top: `${
            (((tempStart ?? period.start) - OPEN) / (CLOSE - OPEN)) * 100
          }%`,
          left: `${
            DAYS.indexOf(day) * 20 + sizeInfo.rowIndex * (20 / sizeInfo.rowSize)
          }%`,
          height: `${
            (Math.max(15, period.end - period.start) / (CLOSE - OPEN)) * 100
          }%`,
          width: `${20 / sizeInfo.rowSize}%`,
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
        ref={blockElementRef}
        onMouseDown={(e): void => {
          if (handleMouseDown) {
            handleMouseDown(e, blockElementRef);
          }
        }}
      >
        {includeContent && (
          <div
            className={classes(
              'meeting-wrapper',
              isDraft && duration <= 15 && 'only-time'
            )}
          >
            <div className="ids">
              {(!isDraft || duration > 15) &&
                contentHeader.map((content, i) => (
                  <span
                    className={content.className}
                    key={`content-header-${i}`}
                  >
                    {content.content}&nbsp;
                  </span>
                ))}
            </div>

            {contentBody.map((content, i) => (
              <span className={content.className} key={`content-body-${i}`}>
                {content.content}
              </span>
            ))}
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
          <DetailsPopoverContent popover={popover} />
        </ReactTooltip>
      )}
    </div>
  );
}

type DetailsPopoverContentProps = {
  popover: TimeBlockPopover[];
};

function DetailsPopoverContent({
  popover,
}: DetailsPopoverContentProps): React.ReactElement {
  return (
    <table className="popover">
      <tbody>
        {popover.map((popoverInfo, i) => {
          return popoverInfo.content ? (
            <tr key={`popover-content-${i}`}>
              <td>
                <b>{popoverInfo.name}</b>
              </td>
              <td>{popoverInfo.content}</td>
            </tr>
          ) : undefined;
        })}
      </tbody>
    </table>
  );
}
