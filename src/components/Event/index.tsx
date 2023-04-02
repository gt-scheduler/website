import { Immutable, castDraft } from 'immer';
import React, { useCallback, useContext, useState } from 'react';
import {
  faPencil,
  faPalette,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

import {
  classes,
  getContentClassName,
  periodToString,
  daysToString,
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
  const [formShown, setFormShown] = useState<boolean>(false);

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
                onClick: (): void => setFormShown(!formShown),
              },
              {
                icon: faPalette,
                tooltip: `Edit Color`,
                id: `${event.id}-color`,
                onClick: (): void => setPaletteShown(!paletteShown),
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
          setFormShown={setFormShown}
        />
      )}
    </div>
  );
}
