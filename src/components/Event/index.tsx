import { Immutable, castDraft } from 'immer';
import React, { useCallback, useContext, useState, useEffect } from 'react';
import {
  faPencil,
  faPalette,
  faTrash,
  faClone,
} from '@fortawesome/free-solid-svg-icons';

import {
  classes,
  getContentClassName,
  periodToString,
  daysToString,
  getRandomColor,
} from '../../utils/misc';
import { ActionRow, EventAdd, Palette } from '..';
import { ScheduleContext } from '../../contexts';
import { Event as EventData } from '../../types';

import './stylesheet.scss';

export type EventProps = {
  className?: string;
  event: Immutable<EventData>;
};

export default function Event({
  className,
  event,
}: EventProps): React.ReactElement | null {
  const [paletteShown, setPaletteShown] = useState<boolean>(false);
  const [{ events, colorMap }, { patchSchedule }] = useContext(ScheduleContext);
  const [formShown, setFormShown] = useState<boolean>(
    Boolean(event.showEditForm)
  );

  const handleDuplicateEvent = useCallback(() => {
    const eventId = new Date().getTime().toString();
    const newEvent = {
      id: eventId,
      name: event.name,
      period: {
        start: event.period.start,
        end: event.period.end,
      },
      days: event.days,
    };

    patchSchedule({
      events: [...castDraft(events), castDraft(newEvent)],
      colorMap: { ...colorMap, [eventId]: getRandomColor() },
    });
  }, [
    colorMap,
    event.days,
    event.name,
    event.period.end,
    event.period.start,
    events,
    patchSchedule,
  ]);

  // this basically forces the edit form to only auto-focus once per render
  useEffect(() => {
    if (!event.showEditForm) return; // skip if this event wasn't flagged (normal render)

    const targetEventId = event.id;

    // Create a new events list where this event's flag is reset
    const nextEvents = castDraft(events).map((existingEvent) =>
      existingEvent.id === targetEventId
        ? { ...existingEvent, showEditForm: false } // remove showEditForm flag
        : existingEvent
    );

    // push updated events list back into global state with schedulecontext
    patchSchedule({ events: nextEvents });
  }, [event.showEditForm, event.id, events, patchSchedule]);

  const handleRemoveEvent = useCallback(
    (id: string) => {
      const newColorMap = { ...colorMap };
      delete newColorMap[id];

      patchSchedule({
        events: castDraft(events).filter(
          (singleEvent) => singleEvent.id !== id
        ),
        colorMap: newColorMap,
      });
    },
    [events, colorMap, patchSchedule]
  );

  const color = colorMap[event.id];
  const contentClassName = color != null && getContentClassName(color);

  return (
    <div>
      {!formShown && (
        <div
          className={classes('Event', contentClassName, 'default', className)}
          style={{ backgroundColor: color }}
          key={event.id}
        >
          <ActionRow
            label={[event.name].join(' ')}
            actions={[
              {
                icon: faPencil,
                onClick: (): void => setFormShown(true),
              },
              {
                icon: faPalette,
                tooltip: `Edit Color`,
                id: `${event.id}-color`,
                onClick: (): void => setPaletteShown(!paletteShown),
              },
              {
                icon: faClone,
                tooltip: 'Duplicate Event',
                id: `${event.id}-duplicate`,
                onClick: (): void => handleDuplicateEvent(),
              },
              {
                icon: faTrash,
                tooltip: `Remove Event`,
                id: `${event.id}-remove`,
                onClick: (): void => handleRemoveEvent(event.id),
              },
            ]}
          >
            <div className="event-row">
              <span>
                {[daysToString(event.days), periodToString(event.period)].join(
                  ' '
                )}
              </span>
            </div>
            {paletteShown && (
              <Palette
                className="palette"
                onSelectColor={(col): void =>
                  patchSchedule({ colorMap: { ...colorMap, [event.id]: col } })
                }
                color={color ?? null}
                onMouseLeave={(): void => setPaletteShown(false)}
              />
            )}
          </ActionRow>
        </div>
      )}
      {formShown && (
        <EventAdd
          className="event-add"
          event={event}
          key={`${event.id}-${event.period.start}-${event.days.join()}`}
          setFormShown={setFormShown}
        />
      )}
    </div>
  );
}
