import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Immutable, castDraft } from 'immer';

import Button from '../Button';
import LocationPicker from '../LocationPicker';
import { classes, getRandomColor, timeToString } from '../../utils/misc';
import { CLOSE, DAYS, OPEN } from '../../constants';
import { ScheduleContext } from '../../contexts';
import { Event as EventData, Location } from '../../types';

import './stylesheet.scss';

// Type guard to check if event has location data
function hasLocationData(
  event: unknown
): event is EventData & { where: string; location: Location | null } {
  return (
    event !== null &&
    typeof event === 'object' &&
    event !== undefined &&
    'where' in event &&
    typeof (event as { where: unknown }).where === 'string'
  );
}

export type EventAddProps = {
  className?: string;
  event?: Immutable<EventData>;
  setFormShown?: (next: boolean) => void;
};

export default function EventAdd({
  className,
  event,
  setFormShown,
}: EventAddProps): React.ReactElement {
  const [{ events, colorMap, palette }, { patchSchedule }] =
    useContext(ScheduleContext);
  const [eventName, setEventName] = useState(event?.name || '');
  const [selectedTags, setSelectedTags] = useState(
    event?.days ? [...event.days] : []
  );
  const [start, setStart] = useState(
    event?.period.start ? timeToString(event.period.start, false, true) : ''
  );
  const [end, setEnd] = useState(
    event?.period.end ? timeToString(event.period.end, false, true) : ''
  );
  const [location, setLocation] = useState<{
    where: string;
    location: Location | null;
  } | null>(
    event && hasLocationData(event)
      ? { where: event.where, location: event.location }
      : null
  );

  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (
      eventName.length > 0 &&
      selectedTags.length > 0 &&
      start !== '' &&
      end !== '' &&
      !error
    ) {
      setSubmitDisabled(false);
    } else {
      setSubmitDisabled(true);
    }
  }, [eventName, selectedTags, start, end, error]);

  const parseTime = useCallback((time: string): number => {
    const split = time.split(':').map((str) => Number(str));

    if (typeof split[0] !== 'undefined' && typeof split[1] !== 'undefined') {
      return split[0] * 60 + split[1];
    }
    return -1; // invalid time string
  }, []);

  const onDiscard = useCallback((): void => {
    if (event) {
      // If this event has never been saved (it's a new draft),
      // delete it entirely
      if (!event.isSaved) {
        // Remove the event from the schedule
        const newEvents = castDraft(events).filter(
          (existingEvent) => existingEvent.id !== event.id
        );
        const newColorMap = { ...colorMap };
        delete newColorMap[event.id];

        patchSchedule({
          events: newEvents,
          colorMap: newColorMap,
        });
      } else if (setFormShown) {
        // If editing an existing saved event,
        // just close the form to revert changes
        setFormShown(false);
      }
    } else {
      // If creating a new event (not yet in schedule), just clear the form
      setEventName('');
      setSelectedTags([]);
      setStart('');
      setEnd('');
      setError('');
      setLocation(null);
      // Force clear the time input fields
      if (startInputRef.current) startInputRef.current.value = '';
      if (endInputRef.current) endInputRef.current.value = '';
    }
  }, [event, events, colorMap, patchSchedule, setFormShown]);

  const handleStartChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const newStart = e.target.value;

      setError('');
      setStart(newStart);

      const parsedStart = parseTime(newStart);
      const parsedEnd = parseTime(end);
      if (parsedEnd !== -1 && parsedEnd <= parsedStart) {
        setError('Start time must be before end time.');
      } else if (parsedStart < OPEN || parsedEnd > CLOSE) {
        setError('Event must be between 06:00 AM and 11:59 PM.');
      }
    },
    [end, parseTime]
  );

  const handleEndChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const newEnd = e.target.value;

      setError('');
      setEnd(newEnd);

      const parsedStart = parseTime(start);
      const parsedEnd = parseTime(newEnd);
      if (parsedStart !== -1 && parsedEnd <= parsedStart) {
        setError('Start time must be before end time.');
      } else if (parsedStart < OPEN || parsedEnd > CLOSE) {
        setError('Event must be between 06:00 AM and 11:59 PM.');
      }
    },
    [start, parseTime]
  );

  const onSubmit = useCallback((): void => {
    const parsedStart = parseTime(start);
    const parsedEnd = parseTime(end);
    const eventWhere = location?.where || '';
    const eventLocation = location?.location || null;

    if (event) {
      const newEvents = castDraft(events).map((existingEvent) =>
        existingEvent.id === event.id
          ? {
              ...existingEvent,
              name: eventName,
              period: {
                start: parsedStart,
                end: parsedEnd,
              },
              days: selectedTags,
              isSaved: true, // Mark as saved
              where: eventWhere,
              location: eventLocation,
            }
          : existingEvent
      );

      patchSchedule({
        events: newEvents,
      });

      if (setFormShown) {
        setFormShown(false);
      }
    } else {
      const eventId = new Date().getTime().toString();
      const newEvent = {
        id: eventId,
        name: eventName,
        period: {
          start: parsedStart,
          end: parsedEnd,
        },
        days: selectedTags,
        isSaved: true, // Mark as saved
        where: eventWhere,
        location: eventLocation,
      };

      patchSchedule({
        events: [...castDraft(events), newEvent],
        colorMap: { ...colorMap, [eventId]: getRandomColor(palette) },
      });

      setEventName('');
      setSelectedTags([]);
      setStart('');
      setEnd('');
      setLocation(null);
    }
  }, [
    event,
    eventName,
    start,
    end,
    selectedTags,
    location,
    events,
    colorMap,
    palette,
    patchSchedule,
    parseTime,
    setFormShown,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        if (!submitDisabled) {
          onSubmit();
        }

        e.preventDefault();
      }
    },
    [onSubmit, submitDisabled]
  );

  const nameInputRef = useRef<HTMLInputElement>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);
  return (
    <div className={classes('EventAdd', className)}>
      <form className="add">
        <table>
          <tbody>
            <tr>
              <td>
                <div
                  className={classes('label', eventName.length > 0 && 'active')}
                >
                  Name
                </div>
              </td>
              <td className="input">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={eventName}
                  onChange={(e): void => setEventName(e.target.value)}
                  placeholder="Event Name"
                  onKeyDown={handleKeyDown}
                />
              </td>
            </tr>
            <tr>
              <td>
                <div
                  className={classes(
                    'label',
                    selectedTags.length > 0 && 'active'
                  )}
                >
                  Days
                </div>
              </td>
              <td className="tag-container">
                {DAYS.map((tag) => (
                  <div
                    key={tag}
                    className={classes(
                      'tag',
                      selectedTags.includes(tag) && 'active'
                    )}
                    onClick={(): void => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter((x) => x !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                  >
                    {tag}
                  </div>
                ))}
              </td>
            </tr>
            <tr>
              <td>
                <div className={classes('label', start !== '' && 'active')}>
                  Start
                </div>
              </td>
              <td className="input">
                <input
                  ref={startInputRef}
                  type="time"
                  value={start}
                  onChange={handleStartChange}
                  onKeyDown={handleKeyDown}
                  aria-label="Start time"
                />
              </td>
            </tr>
            <tr>
              <td>
                <div className={classes('label', end !== '' && 'active')}>
                  End
                </div>
              </td>
              <td className="input">
                <input
                  ref={endInputRef}
                  type="time"
                  value={end}
                  onChange={handleEndChange}
                  onKeyDown={handleKeyDown}
                  aria-label="End time"
                />
              </td>
            </tr>
            <tr>
              <td>
                <div className={classes('label', location?.where && 'active')}>
                  Location
                </div>
              </td>
              <td className="input">
                <LocationPicker
                  value={location}
                  onChange={(locationData): void => {
                    setLocation(locationData);
                  }}
                  onClear={(): void => {
                    setLocation(null);
                  }}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="submit">
                <div className="button-container">
                  <Button
                    className="button discard-button"
                    onClick={onDiscard}
                    disabled={
                      !eventName &&
                      !start &&
                      !end &&
                      selectedTags.length === 0 &&
                      !location &&
                      !event?.isSaved
                    }
                    id="event-discard-button"
                  >
                    Discard
                  </Button>
                  <Button
                    className="button add-button"
                    disabled={submitDisabled}
                    onClick={onSubmit}
                    id="event-add-button"
                  >
                    {event?.id ? 'Save' : 'Add'}
                  </Button>
                </div>
                {error && <div className="error">{error}</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
}
