import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Immutable, castDraft } from 'immer';

import Button from '../Button';
import { classes, getRandomColor, timeToString } from '../../utils/misc';
import { DAYS } from '../../constants';
import { ScheduleContext } from '../../contexts';
import { Event as EventData } from '../../types';

import './stylesheet.scss';
import Select from '../Select';

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
    (newStart: string): void => {
      setError('');
      setStart(newStart);

      const parsedStart = parseTime(newStart);
      const parsedEnd = parseTime(end);
      if (parsedEnd !== -1 && parsedEnd <= parsedStart) {
        setError('Start time must be before end time.');
      } else if (
        parsedStart !== -1 &&
        (parsedStart < 480 || parsedEnd > 1320)
      ) {
        setError('Event must be between 08:00 AM and 10:00 PM.');
      }
    },
    [end, parseTime]
  );

  const handleEndChange = useCallback(
    (newEnd: string): void => {
      setError('');
      setEnd(newEnd);

      const parsedStart = parseTime(start);
      const parsedEnd = parseTime(newEnd);
      if (parsedEnd !== -1 && parsedEnd <= parsedStart) {
        setError('Start time must be before end time.');
      } else if (
        parsedStart !== -1 &&
        (parsedStart < 480 || parsedEnd > 1320)
      ) {
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
                <TimeInput onChange={handleStartChange} value={start} />
              </td>
            </tr>
            <tr>
              <td>
                <div className={classes('label', end !== '' && 'active')}>
                  End
                </div>
              </td>
              <td className="input">
                <TimeInput onChange={handleEndChange} value={end} />
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="submit">
                <Button
                  className="button"
                  disabled={submitDisabled}
                  onClick={onSubmit}
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

export type TimeInputProps = {
  value: string;
  onChange: (newTime: string) => void;
};

function TimeInput(props: TimeInputProps): React.ReactElement {
  const { value } = props;

  function getTime(): [string, string, boolean] {
    console.log(value);

    let hour = '';
    let minute = '';
    let morning = true;
    if (value) {
      const split = value.split(':');
      hour = split[0]!;
      minute = split[1]!;

      let parsedHour = parseInt(hour, 10);
      if (parsedHour % 12 === 0) {
        parsedHour += 12;
      }
      if (parsedHour >= 12) {
        morning = false;
      }
      if (!morning) {
        hour = (parsedHour - 12).toString().padStart(2, '0');
      }
    }
    return [hour, minute, morning];
  }

  const [hour, setHour] = useState(getTime()[0]);
  const [minute, setMinute] = useState(getTime()[1]);
  const [morning, setMorning] = useState(getTime()[2]);
  const { onChange } = props;

  useEffect(() => {
    const [newHour, newMinute, newMorning] = getTime();
    setHour(newHour);
    setMinute(newMinute);
    setMorning(newMorning);
  }, [props]);

  function getTimeString(): string {
    if (!hour || !minute) {
      return '';
    }
    const time = parseInt(hour, 10) * 60 + parseInt(minute, 10);
    return timeToString(time, false, true);
  }

  function handleHourChange(e: ChangeEvent<HTMLInputElement>): void {
    const re = /^[0-9\b]+$/;

    // if value is not blank, then test the regex
    if (e.target.value === '' || re.test(e.target.value)) {
      setHour(e.target.value);
    }
  }

  function formatHour(): void {
    if (hour === '') {
      return;
    }

    const parsed = parseInt(hour, 10);
    if (parsed < 1) {
      setHour('01');
    } else if (parsed > 12) {
      setHour('12');
    } else {
      setHour(parsed.toString().padStart(2, '0'));
    }
    onChange(getTimeString());
  }

  function handleMinuteChange(e: ChangeEvent<HTMLInputElement>): void {
    const re = /^[0-9\b]+$/;

    // if value is not blank, then test the regex
    if (e.target.value === '' || re.test(e.target.value)) {
      setMinute(e.target.value);
    }
  }

  function formatMinute(): void {
    if (minute === '') {
      return;
    }

    const parsed = parseInt(minute, 10);
    if (parsed < 0) {
      setMinute('00');
    } else if (parsed > 59) {
      setMinute('59');
    } else {
      setMinute(parsed.toString().padStart(2, '0'));
    }
    onChange(getTimeString());
  }

  const handleMorningChange = useCallback((newId: string): void => {
    if (newId === 'am') {
      setMorning(true);
    } else {
      setMorning(false);
    }
    onChange(getTimeString());
  }, []);

  return (
    <>
      <input
        className="time"
        type="text"
        maxLength={2}
        placeholder="--"
        value={hour}
        onChange={handleHourChange}
        onBlur={formatHour}
      />
      <div className="colon">:</div>
      <input
        className="time"
        type="text"
        maxLength={2}
        placeholder="--"
        value={minute}
        onChange={handleMinuteChange}
        onBlur={formatMinute}
      />
      <Select
        onChange={handleMorningChange}
        current={morning ? 'am' : 'pm'}
        options={[
          { id: 'am', label: 'AM' },
          { id: 'pm', label: 'PM' },
        ]}
        className="ampm"
      />
    </>
  );
}
