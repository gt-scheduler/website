import { castDraft } from 'immer';
import React, { useCallback, useContext, useState } from 'react';
import {
  faPencil,
  faPalette,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

import { classes, getContentClassName, periodToString } from '../../utils/misc';
import { ActionRow, Palette } from '..';
import { ScheduleContext } from '../../contexts';
import { Period } from '../../types';

import './stylesheet.scss';

export type CourseProps = {
  eventId: string;
  eventName: string;
  eventPeriod: Period;
  eventDays: readonly string[];
};

export default function CustomEvent({
  eventId,
  eventName,
  eventPeriod,
  eventDays,
}: CourseProps): React.ReactElement | null {
  const [paletteShown, setPaletteShown] = useState<boolean>(false);
  const [{ events, colorMap }, { patchSchedule }] = useContext(ScheduleContext);
  const [formShown, setFormShown] = useState<boolean>(false);

  const handleRemoveEvent = useCallback(
    (id: string) => {
      const newColorMap = { ...colorMap };
      delete newColorMap[id];

      patchSchedule({
        events: events
          .filter((singleEvent) => singleEvent.id !== id)
          .map((singleEvent) => castDraft(singleEvent)),
        colorMap: newColorMap,
      });
    },
    [events, colorMap, patchSchedule]
  );

  const color = colorMap[eventId];
  const contentClassName = color != null && getContentClassName(color);

  return (
    <div>
      {!formShown && (
        <div
          className={classes('Event', contentClassName, 'default')}
          style={{ backgroundColor: color }}
          key={eventId}
        >
          <ActionRow
            label={[eventName].join(' ')}
            actions={[
              {
                icon: faPencil,
                onClick: (): void => setFormShown(!formShown),
              },
              {
                icon: faPalette,
                onClick: (): void => setPaletteShown(!paletteShown),
              },
              {
                icon: faTrash,
                onClick: (): void => handleRemoveEvent(eventId),
              },
            ]}
          >
            <div className="event-row">
              <span>
                {[eventDays.join(''), periodToString(eventPeriod)].join(' ')}
              </span>
            </div>
            {paletteShown && (
              <Palette
                className="palette"
                onSelectColor={(col): void =>
                  patchSchedule({ colorMap: { ...colorMap, [eventId]: col } })
                }
                color={color ?? null}
                onMouseLeave={(): void => setPaletteShown(false)}
              />
            )}
          </ActionRow>
        </div>
      )}
      {formShown && (
        // put form here
        <div />
      )}
    </div>
  );
}
