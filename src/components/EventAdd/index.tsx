import React, {
    useContext,
    useEffect,
    useState,
  } from 'react';

import { classes } from '../../utils/misc';
import { DAYS } from '../../constants';
import { ScheduleContext } from '../../contexts';

import './stylesheet.scss';
import Button from '../Button';

export type EventAddProps = {
  className?: string;
};

export default function EventAdd({
  className,
}: EventAddProps): React.ReactElement {

  const [{events, colorMap}, { patchSchedule }] = useContext(ScheduleContext);
  const [eventName, setEventName] = useState("");
  const [selectedTags, setSelectedTags] = useState<Array<string>>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(true);

  useEffect(() => {
    if (eventName.length > 0 && selectedTags.length > 0 && start.length > 0 && end.length > 0) {
      setSubmitDisabled(false);
    } else {
      setSubmitDisabled(true);
    }
  }, [eventName, selectedTags, start, end])

  // function onSubmit() {
  //   const startSplit = start.split(":").map(str => Number(str));
  //   const startNum = startSplit[0]! * 60 + startSplit[1]!;

  //   const endSplit = end.split(":").map(str => Number(str));
  //   const endNum = endSplit[0]! * 60 + endSplit[1]!;

    // const event = {
    //   id: 0,
      
    // };

    // patchSchedule({
    //   events: [...events, event]
    // })
  // }

  return (
    <div className={classes('EventAdd', className)}>
      <div className="add">
        <table>
          <tr>
            <td>
              <div className={classes("label", eventName.length > 0 && 'active')}>
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
              <div className={classes("label", selectedTags.length > 0 && 'active')}>
                Days
              </div>
            </td>
            <td className="tag-container">
              {DAYS.map((tag) => (
                <div
                  key={tag}
                  className={classes('tag', selectedTags.includes(tag) && 'active')}
                  onClick={(): void => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(x => x !== tag));
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
              <div className={classes("label", start !== "" && 'active')}>
                Start
              </div>
            </td>
            <td className="input">
              <input
                type="time"
                value={start}
                onChange={(event): void => {setStart(event.target.value)}}
              />
            </td>
          </tr>
          <tr>
            <td>
              <div className={classes("label", end !== "" && 'active')}>
                End
              </div>
            </td>
            <td className="input">
              <input
                type="time"
                value={end}
                onChange={(event): void => setEnd(event.target.value)}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="submit">
              <Button className="button" disabled={submitDisabled} onClick={() => {/* todo */}}>
                Add
              </Button>
            </td>
          </tr>
        </table>
      </div>
    </div>
  );
}
