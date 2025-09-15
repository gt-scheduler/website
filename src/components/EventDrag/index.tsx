import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { castDraft } from 'immer';

import { ScheduleContext, ThemeContext } from '../../contexts';
import { TimeBlocks } from '..';
import { SizeInfo, makeSizeInfoKey } from '../TimeBlocks';
import { DAYS, OPEN, CLOSE, RECURRING_EVENTS } from '../../constants';
import { getRandomColor, periodToString } from '../../utils/misc';
import { Event } from '../../types';

export type EventDragProps = {
  enabled?: boolean;
  className?: string;
  defaultName?: string;
  minDuration?: number;
  snap?: number;
  daysRef: React.RefObject<HTMLDivElement>;
  timesRef: React.RefObject<HTMLDivElement>;
  overlay?: boolean;
  includeContent?: boolean;
  canBeTabFocused?: boolean;
  deviceHasHover?: boolean;
  scheduleId?: string;
  onCreate?: (ev: Event) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
};

type DraftEvent = { day: string; start: number; end: number };

const DRAG_THRESHOLD_PX = 14;
const MIN_EVENT_DURATION = 14; // minutes

export default function EventDrag({
  enabled = true,
  className,
  defaultName = 'New Recurring Event',
  minDuration = 0,
  snap = 15,
  daysRef,
  timesRef,
  overlay = false,
  includeContent = true,
  canBeTabFocused = false,
  deviceHasHover = true,
  scheduleId,
  onCreate,
  containerRef,
}: EventDragProps): React.ReactElement | null {
  const [{ colorMap, events }, { patchSchedule, setCourseContainerTab }] =
    useContext(ScheduleContext);
  const [theme] = useContext(ThemeContext);

  const rootRef = useRef<HTMLDivElement | null>(null);

  const [draftEvent, setDraftEvent] = useState<DraftEvent | null>(null);
  const draftRef = useRef<DraftEvent | null>(null);
  const pressRef = useRef<{
    x: number;
    y: number;
    day: string;
    anchor: number;
  } | null>(null);

  const snapTo = useCallback(
    (m: number): number => Math.round(m / snap) * snap,
    [snap]
  );

  const BLOCK_SELECTOR =
    '.meeting, .meeting--dragging, .meeting--clone, [data-meeting], [data-event], .Event';

  // Build a SizeInfo object for the draftEvent
  // block so TimeBlocks can render it
  const draftEventSizeInfo: SizeInfo = useMemo(() => {
    if (!draftEvent) return {};
    const key = makeSizeInfoKey({
      start: draftEvent.start,
      end: draftEvent.end,
    });
    return {
      [draftEvent.day]: {
        [key]: {
          period: { start: draftEvent.start, end: draftEvent.end },
          id: 'draft',
          rowIndex: 0,
          rowSize: 1,
        },
      },
    };
  }, [draftEvent]);

  // scan beneath the overlay to tell whether pointer is over an existing block
  const isOverExistingBlock = useCallback(
    (clientX: number, clientY: number): boolean => {
      const root = rootRef.current;
      if (!root) return false;
      const prev = root.style.pointerEvents;
      root.style.pointerEvents = 'none';
      const el = document.elementFromPoint(
        clientX,
        clientY
      ) as HTMLElement | null;
      root.style.pointerEvents = prev || '';
      return !!el?.closest(BLOCK_SELECTOR);
    },
    []
  );

  // Convert a pointer position to (day column, minutes) within the grid
  const pointToDayTime = useCallback(
    (
      clientX: number,
      clientY: number
    ): { day: string | null; minutes: number } => {
      if (!daysRef.current || !timesRef.current)
        return { day: null, minutes: OPEN };

      const { left: daysLeft, width: daysWidth } =
        daysRef.current.getBoundingClientRect();
      const { top: timesTop, height: timesHeight } =
        timesRef.current.getBoundingClientRect();

      const colFloat = (clientX - daysLeft) / daysWidth;
      const col = Math.floor(colFloat * DAYS.length);
      const day = DAYS[col] ?? null;

      const pctY = (clientY - timesTop) / Math.max(1, timesHeight);
      let minutes = snapTo(OPEN + pctY * (CLOSE - OPEN));
      if (minutes < OPEN) minutes = OPEN;
      if (minutes > CLOSE) minutes = CLOSE;

      return { day, minutes };
    },
    [daysRef, timesRef, snapTo]
  );

  // Resize the draftEvent as the pointer
  // moves, respecting bounds and min duration
  const handlePointerDown = useCallback(
    (e: React.PointerEvent): void => {
      if (!enabled) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const { clientX, clientY, pointerId } = e;
      if (isOverExistingBlock(clientX, clientY)) return;

      const { day, minutes } = pointToDayTime(clientX, clientY);
      if (!day) return;

      pressRef.current = { x: clientX, y: clientY, day, anchor: minutes };

      const start0 = Math.min(minutes, CLOSE - minDuration);
      const end0 = Math.min(CLOSE, start0 + minDuration);
      const draft0: DraftEvent = { day, start: start0, end: end0 };
      draftRef.current = draft0;
      setDraftEvent(draft0);

      rootRef.current?.setPointerCapture(pointerId);
      e.preventDefault();
    },
    [enabled, isOverExistingBlock, pointToDayTime, minDuration]
  );

  // dragging: resize draftEvent as the pointer moves
  // up/down, respecting bounds and min duration
  const handlePointerMove = useCallback(
    (e: React.PointerEvent): void => {
      if (!pressRef.current || !draftRef.current) return;

      const { clientX, clientY } = e;

      const dx = Math.abs(clientX - pressRef.current.x);
      const dy = Math.abs(clientY - pressRef.current.y);
      if (dx < DRAG_THRESHOLD_PX && dy < DRAG_THRESHOLD_PX) return;

      const pr = pressRef.current;
      const { anchor, day: pressDay } = pr;

      const { minutes: cur } = pointToDayTime(clientX, clientY);

      let start = Math.min(anchor, cur);
      let end = Math.max(anchor, cur);

      if (end - start < minDuration) {
        if (cur >= anchor) end = start + minDuration;
        else start = end - minDuration;
      }

      if (start < OPEN) {
        const shift = OPEN - start;
        start = OPEN;
        end = Math.min(CLOSE, end + shift);
      }
      if (end > CLOSE) {
        const shift = end - CLOSE;
        end = CLOSE;
        start = Math.max(OPEN, start - shift);
      }

      const next: DraftEvent = { day: pressDay, start, end };
      draftRef.current = next;
      window.requestAnimationFrame(() => setDraftEvent(next));

      e.preventDefault();
    },
    [minDuration, pointToDayTime]
  );

  // mouse up: commit a new event and switch to the Events tab
  const handlePointerUp = useCallback(
    (e: React.PointerEvent): void => {
      const { pointerId } = e;
      try {
        if (rootRef.current?.hasPointerCapture(pointerId)) {
          rootRef.current.releasePointerCapture(pointerId);
        }
      } catch {
        /* no-op */
      }

      const { current: d } = draftRef;

      draftRef.current = null;
      pressRef.current = null;
      setDraftEvent(null);

      // Only create event if drag actually covered at least 15 minutes
      if (d && d.end - d.start >= MIN_EVENT_DURATION) {
        const eventId = new Date().getTime().toString();

        const newEvent: Event = {
          id: eventId,
          name: defaultName,
          days: [d.day],
          period: { start: d.start, end: d.end },
          showEditForm: true,
        };

        patchSchedule({
          events: [...castDraft(events), newEvent],
          colorMap: { ...colorMap, [eventId]: getRandomColor() },
        });

        onCreate?.(newEvent);
        setCourseContainerTab(RECURRING_EVENTS);
      }

      e.preventDefault();
    },
    [
      defaultName,
      patchSchedule,
      events,
      colorMap,
      onCreate,
      setCourseContainerTab,
    ]
  );

  // Scoped pointerdown listener: only inside the calendar root
  useEffect(() => {
    if (!enabled) return;
    if (!containerRef?.current) {
      return;
    }

    const container = containerRef.current;

    function handleScopedPointerDown(nativeEvent: PointerEvent): void {
      const x = nativeEvent.clientX;
      const y = nativeEvent.clientY;

      // ignore clicks on existing events
      if (isOverExistingBlock(x, y)) return;

      const reactLikeEvent = {
        clientX: x,
        clientY: y,
        pointerId: nativeEvent.pointerId,
        pointerType: nativeEvent.pointerType,
        button: nativeEvent.button,
        preventDefault: () => nativeEvent.preventDefault(),
      } as React.PointerEvent;

      handlePointerDown(reactLikeEvent);
    }

    container.addEventListener('pointerdown', handleScopedPointerDown);

    return () => {
      container.removeEventListener('pointerdown', handleScopedPointerDown);
    };
  }, [enabled, containerRef, handlePointerDown, isOverExistingBlock]);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      className={['event-drag-overlay', className].filter(Boolean).join(' ')}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e): void => {
        e.preventDefault();
      }}
      style={{ pointerEvents: draftEvent ? 'auto' : 'none' }}
    >
      {draftEvent && (
        <TimeBlocks
          className={`${theme}-content meeting--draft`}
          id="new-event-draft"
          meetingIndex={1}
          period={{ start: draftEvent.start, end: draftEvent.end }}
          tempStart={draftEvent.start}
          days={[draftEvent.day]}
          contentHeader={[{ className: 'event-name', content: defaultName }]}
          contentBody={[
            {
              className: 'period',
              content: periodToString({
                start: draftEvent.start,
                end: draftEvent.end,
              }),
            },
          ]}
          popover={[
            { name: 'Name', content: defaultName },
            {
              name: 'Time',
              content: periodToString({
                start: draftEvent.start,
                end: draftEvent.end,
              }),
            },
          ]}
          overlay={overlay}
          capture={false}
          sizeInfo={draftEventSizeInfo}
          includeDetailsPopover={false}
          includeContent={includeContent}
          canBeTabFocused={canBeTabFocused}
          schedule={scheduleId}
          selectedMeeting={null}
          deviceHasHover={deviceHasHover}
        />
      )}
    </div>
  );
}
