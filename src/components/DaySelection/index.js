import React, { useState } from 'react';
import { ActionRow } from '..';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { classes, getContentClassName } from '../../utils';
import './stylesheet.scss';

export function DaySelection({ courseDateMap }) {
  const [activeDay, setActiveDay] = useState('');
  const colorPalette = ['#FCB9AA', '#FFDBCC', '#ECEAE4', '#A2E1DB', '#55CBCD'];
  const daysOfTheWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
  ];

  function LightenDarkenColor(col, amt) {
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    let b = ((num >> 8) & 0x00ff) + amt;
    let g = (num & 0x0000ff) + amt;
    let newColor = g | (b << 8) | (r << 16);
    return newColor.toString(16);
  }

  const formatTime = (time) => {
    return (
      (Math.floor(time / 60) > 12
        ? Math.floor(time / 60) % 12
        : Math.floor(time / 60)) +
      ':' +
      (time % 60 == 0 ? '00' : time % 60)
    );
  };

  return (
    <div className="date-container">
      {Object.keys(courseDateMap).map((date, i) => (
        <div
          className={classes(
            'date',
            getContentClassName(colorPalette[i]),
            'default'
          )}
          style={{ backgroundColor: colorPalette[i] }}
        >
          <ActionRow
            label={daysOfTheWeek[i]}
            className="day-select"
            actions={[
              {
                icon: date === activeDay ? faAngleUp : faAngleDown,
                onClick: () =>
                  date !== activeDay ? setActiveDay(date) : setActiveDay('')
              }
            ]}
          />
          {activeDay === date && (
            <div className="dropdown-content">
              {courseDateMap[date].length === 0 ? (
                <div className="course-content">No classes this day!</div>
              ) : (
                courseDateMap[date].map((course, i) => (
                  <div className="course-content">
                    <div className="course-id">{course.id}</div>
                    <span className="course-row">{course.title}</span>
                    <span className="course-row">
                      {formatTime(course.times.start)} -
                      {formatTime(course.times.end)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
