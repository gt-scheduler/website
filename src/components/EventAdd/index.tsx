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
import { classes, getRandomColor, timeToString } from '../../utils/misc';
import { DAYS } from '../../constants';
import { ScheduleContext } from '../../contexts';
import { Event as EventData } from '../../types';

import './stylesheet.scss';

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
  const [{ events, colorMap }, { patchSchedule }] = useContext(ScheduleContext);
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

  const handleStartChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const newStart = e.target.value;

      setError('');
      setStart(newStart);

      const parsedStart = parseTime(newStart);
      const parsedEnd = parseTime(end);
      if (parsedEnd !== -1 && parsedEnd <= parsedStart) {
        setError('Start time must be before end time.');
      } else if (parsedStart < 480 || parsedEnd > 1320) {
        setError('Event must be between 08:00 AM and 10:00 PM.');
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
      } else if (parsedStart < 480 || parsedEnd > 1320) {
        setError('Event must be between 08:00 AM and 10:00 PM.');
      }
    },
    [start, parseTime]
  );

  const onSubmit = useCallback((): void => {
    const parsedStart = parseTime(start);
    const parsedEnd = parseTime(end);

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
      };

      patchSchedule({
        events: [...castDraft(events), newEvent],
        colorMap: { ...colorMap, [eventId]: getRandomColor() },
      });

      setEventName('');
      setSelectedTags([]);
      setStart('');
      setEnd('');
    }
  }, [
    event,
    eventName,
    start,
    end,
    selectedTags,
    events,
    colorMap,
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
                  type="time"
                  value={start}
                  onChange={handleStartChange}
                  onKeyDown={handleKeyDown}
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
                  type="time"
                  value={end}
                  onChange={handleEndChange}
                  onKeyDown={handleKeyDown}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="submit">
                <Button
                  className="button"
                  disabled={submitDisabled}
                  onClick={onSubmit}
                  id="event-add-button"
                >
                  {event?.id ? 'Save' : 'Add'}
                </Button>
                {error && <div className="error">{error}</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
}
