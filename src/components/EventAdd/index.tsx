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
import { classes, getRandomColor } from '../../utils/misc';
import { DAYS } from '../../constants';
import { ScheduleContext } from '../../contexts';
import { Event as EventData } from '../../types';
import Select from '../Select';

import './stylesheet.scss';

export type EventAddProps = {
  className?: string;
  event?: Immutable<EventData>;
  setFormShown?: (next: boolean) => void;
};

export type Time = {
  hour: number;
  minute: number;
  morning: boolean;
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
  const [start, setStart] = useState<Time>({
    hour: event?.period.start
      ? Math.floor(event.period.start / 60) % 12
        ? Math.floor(event.period.start / 60) % 12
        : 12
      : -1,
    minute: event?.period.start ? event.period.start % 60 : -1,
    morning: event?.period.start ? event.period.start < 720 : true,
  });
  const [end, setEnd] = useState<Time>({
    hour: event?.period.end
      ? Math.floor(event.period.end / 60) % 12
        ? Math.floor(event.period.end / 60) % 12
        : 12
      : -1,
    minute: event?.period.end ? event.period.end % 60 : -1,
    morning: event?.period.end ? event.period.end < 720 : true,
  });
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [error, setError] = useState('');
  const [renderCounter, setRenderCounter] = useState(0);

  useEffect(() => {
    if (
      eventName.length > 0 &&
      selectedTags.length > 0 &&
      start.hour !== -1 &&
      start.minute !== -1 &&
      end.minute !== -1 &&
      end.hour !== -1 &&
      !error
    ) {
      setSubmitDisabled(false);
    } else {
      setSubmitDisabled(true);
    }
  }, [eventName, selectedTags, start, end, error]);

  const parseTime = useCallback((time: Time): number => {
    if (time.hour === -1 || time.minute === -1) {
      return -1; // invalid time
    }

    let { hour } = time;
    if (hour === 12) {
      hour = 0;
    }
    if (!time.morning) {
      hour += 12;
    }
    return hour * 60 + time.minute;
  }, []);

  const timeChangeHelper = useCallback(
    (newTime: Time, isStartTime: boolean): void => {
      setError('');
      // validation
      if (newTime.hour !== -1) {
        if (newTime.hour !== -1 && newTime.hour < 1) {
          newTime.hour = 1;
        } else if (newTime.hour > 12) {
          newTime.hour = 12;
        }
      }
      if (newTime.minute !== -1) {
        if (newTime.minute > 59) {
          newTime.minute = 59;
        }
      }
      // Updating state
      if (isStartTime) {
        setStart(newTime);
      } else {
        setEnd(newTime);
      }

      const parsedStart = isStartTime ? parseTime(newTime) : parseTime(start);
      const parsedEnd = isStartTime ? parseTime(end) : parseTime(newTime);

      if (parsedEnd !== -1 && parsedEnd <= parsedStart) {
        setError('Start time must be before end time.');
      } else if (
        parsedStart !== -1 &&
        (parsedStart < 480 || parsedEnd > 1320)
      ) {
        setError('Event must be between 08:00 AM and 10:00 PM.');
      }
    },
    [parseTime, start, end]
  );

  const handleStartChange = useCallback(
    (newStart: Time): void => {
      setRenderCounter(renderCounter + 1);
      timeChangeHelper(newStart, true);
    },
    [renderCounter, timeChangeHelper]
  );

  const handleEndChange = useCallback(
    (newEnd: Time): void => {
      setRenderCounter(renderCounter + 1);
      timeChangeHelper(newEnd, false);
    },
    [renderCounter, timeChangeHelper]
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
      setStart({
        minute: -1,
        hour: -1,
        morning: true,
      });
      setEnd({
        minute: -1,
        hour: -1,
        morning: true,
      });
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
                <div
                  className={classes(
                    'label',
                    parseTime(start) !== -1 && 'active'
                  )}
                >
                  Start
                </div>
              </td>
              <td className="input">
                <TimeInput
                  onChange={handleStartChange}
                  value={start}
                  key={`${start.hour}-${start.minute}-${
                    start.morning ? 'AM' : 'PM'
                  }-${renderCounter}`}
                />
              </td>
            </tr>
            <tr>
              <td>
                <div
                  className={classes(
                    'label',
                    parseTime(end) !== -1 && 'active'
                  )}
                >
                  End
                </div>
              </td>
              <td className="input">
                <TimeInput
                  onChange={handleEndChange}
                  value={end}
                  key={`${end.hour}-${end.minute}-${
                    end.morning ? 'AM' : 'PM'
                  }-${renderCounter}`}
                />
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
  value: Time;
  onChange: (newTime: Time) => void;
};

function TimeInput(props: TimeInputProps): React.ReactElement {
  const { value } = props;

  const initHour =
    value.hour === -1 ? '' : value.hour.toString().padStart(2, '0');
  const initMinute =
    value.minute === -1 ? '' : value.minute.toString().padStart(2, '0');
  const initMorning = value.morning;

  const [hour, setHour] = useState(initHour);
  const [minute, setMinute] = useState(initMinute);
  const [morning] = useState(initMorning);

  const { onChange } = props;

  const getTime = useCallback(
    (actualMorning?: boolean): Time => {
      const hourNum = hour ? parseInt(hour, 10) : -1;
      const minuteNum = minute ? parseInt(minute, 10) : -1;
      const usedMorning = actualMorning === undefined ? morning : actualMorning;
      return {
        hour: hourNum,
        minute: minuteNum,
        morning: usedMorning,
      };
    },
    [hour, minute, morning]
  );

  function handleHourChange(e: ChangeEvent<HTMLInputElement>): void {
    const re = /^[0-9\b]+$/;

    // if value is not blank, then test the regex
    if (e.target.value === '' || re.test(e.target.value)) {
      setHour(e.target.value);
    }
  }

  function formatHour(): void {
    onChange(getTime());
  }

  function handleMinuteChange(e: ChangeEvent<HTMLInputElement>): void {
    const re = /^[0-9\b]+$/;

    // if value is not blank, then test the regex
    if (e.target.value === '' || re.test(e.target.value)) {
      setMinute(e.target.value);
    }
  }

  function formatMinute(): void {
    onChange(getTime());
  }

  const handleMorningChange = useCallback(
    (newId: string): void => {
      onChange(getTime(newId === 'am'));
    },
    [getTime, onChange]
  );

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
