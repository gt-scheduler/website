import React, { useCallback, useContext, useEffect, useState } from 'react';

import { classes, getRandomColor } from '../../utils/misc';
import { DAYS } from '../../constants';
import { ScheduleContext } from '../../contexts';

import './stylesheet.scss';
import Button from '../Button';
import { castDraft } from 'immer';

export type EventAddProps = {
  className?: string;
};

export default function EventAdd({
  className,
}: EventAddProps): React.ReactElement {
  const [{ events, colorMap }, { patchSchedule }] = useContext(ScheduleContext);
  const [eventName, setEventName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [start, setStart] = useState<number>(-1);
  const [end, setEnd] = useState<number>(-1);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (
      eventName.length > 0 &&
      selectedTags.length > 0 &&
      start !== -1 &&
      end !== -1 &&
      !error
    ) {
      setSubmitDisabled(false);
    } else {
      setSubmitDisabled(true);
    }
  }, [eventName, selectedTags, start, end]);

  function parseTime(time: string): number {
    const split = time.split(':').map((str) => Number(str));
    return split[0]! * 60 + split[1]!;
  }

  function handleStartChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const newStart = parseTime(event.target.value);

    setError('');
    setStart(newStart);

    if (end !== -1 && end <= newStart) {
      setError('Start time must be before end time.');
    }
  }

  function handleEndChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const newEnd = parseTime(event.target.value);

    setError('');
    setEnd(newEnd);

    if (start !== -1 && newEnd <= start) {
      setError('Start time must be before end time.');
    }
  }

  const onSubmit = useCallback((): void => {
    const id = new Date().getTime().toString();
    const event = {
      id,
      name: eventName,
      period: {
        start,
        end,
      },
      days: selectedTags,
    };

    patchSchedule({
      events: [...castDraft(events), event],
      colorMap: { ...colorMap, [id]: getRandomColor() },
    });
  }, [eventName, start, end, selectedTags, events]);

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
                  >
                    {tag}
                  </div>
                ))}
              </td>
            </tr>
            <tr>
              <td>
                <div className={classes('label', start !== -1 && 'active')}>
                  Start
                </div>
              </td>
              <td className="input">
                <input type="time" onChange={handleStartChange} />
              </td>
            </tr>
            <tr>
              <td>
                <div className={classes('label', end !== -1 && 'active')}>
                  End
                </div>
              </td>
              <td className="input">
                <input type="time" onChange={handleEndChange} />
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
