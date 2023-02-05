import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { castDraft } from 'immer';

import Button from '../Button';
import { classes, getRandomColor } from '../../utils/misc';
import { DAYS } from '../../constants';
import { ScheduleContext } from '../../contexts';

import './stylesheet.scss';

export type EventAddProps = {
  className?: string;
  id?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
};

export default function EventAdd({
  className,
  id,
  name = '',
  startTime = '',
  endTime = '',
  days = [],
}: EventAddProps): React.ReactElement {
  const [{ events, colorMap }, { patchSchedule }] = useContext(ScheduleContext);
  const [eventName, setEventName] = useState(name);
  const [selectedTags, setSelectedTags] = useState(days);
  const [start, setStart] = useState(startTime);
  const [end, setEnd] = useState(endTime);
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

  function parseTime(time: string): number {
    const split = time.split(':').map((str) => Number(str));

    if (typeof split[0] !== 'undefined' && typeof split[1] !== 'undefined') {
      return split[0] * 60 + split[1];
    }
    return -1; // invalid time string
  }

  function handleStartChange(event: ChangeEvent<HTMLInputElement>): void {
    const newStart = event.target.value;

    setError('');
    setStart(newStart);

    const parsedStart = parseTime(newStart);
    const parsedEnd = parseTime(end);
    if (parsedEnd !== -1 && parsedEnd <= parsedStart) {
      setError('Start time must be before end time.');
    }
  }

  function handleEndChange(event: ChangeEvent<HTMLInputElement>): void {
    const newEnd = event.target.value;

    setError('');
    setEnd(newEnd);

    const parsedStart = parseTime(start);
    const parsedEnd = parseTime(newEnd);
    if (parsedStart !== -1 && parsedEnd <= parsedStart) {
      setError('Start time must be before end time.');
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      if (!submitDisabled) {
        onSubmit();
      }

      event.preventDefault();
    }
  }

  const onSubmit = useCallback((): void => {
    const eventId = id ?? new Date().getTime().toString();
    const event = {
      id: eventId,
      name: eventName,
      period: {
        start: parseTime(start),
        end: parseTime(end),
      },
      days: selectedTags,
    };

    patchSchedule({
      events: [...castDraft(events), event],
      colorMap: { ...colorMap, [eventId]: getRandomColor() },
    });

    setEventName('');
    setSelectedTags([]);
    setStart('');
    setEnd('');
  }, [
    eventName,
    start,
    end,
    selectedTags,
    events,
    colorMap,
    patchSchedule,
    id,
  ]);

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
                  onChange={(event): void => setEventName(event.target.value)}
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
                >
                  Add
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
