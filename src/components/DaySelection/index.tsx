import React from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { ActionRow } from '..';
import { classes, getContentClassName } from '../../utils';

import './stylesheet.scss';

type Day = 'M' | 'T' | 'W' | 'R' | 'F';
export type DaySelectionProps = {
  courseDateMap: Record<Day, object[]>;
  activeDay: Day | '';
  setActiveDay: (next: Day | '') => void;
};

export default function DaySelection({
  courseDateMap,
  activeDay,
  setActiveDay
}: DaySelectionProps) {
  const colorPalette = ['#FCB9AA', '#FFDBCC', '#ECEAE4', '#A2E1DB', '#55CBCD'];
  const daysOfTheWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday'
  ];

  const formatTime = (time: number): string => {
    if (Math.floor(time / 60) > 12) {
      return `${Math.floor(time / 60) % 12}:${
        time % 60 === 0 ? '00' : time % 60
      }pm`;
    }
    return `${Math.floor(time / 60)}:${time % 60 === 0 ? '00' : time % 60}am`;
  };

  return (
    <div className="date-container">
      {Object.keys(courseDateMap).map((date, i) => (
        <div
          key={date}
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
                  date !== activeDay
                    ? setActiveDay(date as Day)
                    : setActiveDay('')
              }
            ]}
          />
          {activeDay === date && (
            <div className="dropdown-content">
              {courseDateMap[date as Day].length === 0 ? (
                <div className="course-content">No classes this day!</div>
              ) : (
                courseDateMap[date as Day].map((course: any) => (
                  <div className="course-content">
                    <div className="course-id">{course.id}</div>
                    <span className="course-row">{course.title}</span>
                    <span className="course-row">
                      {course.daysOfWeek} {formatTime(course.times.start)} -{' '}
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
