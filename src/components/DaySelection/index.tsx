import React from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { ActionRow } from '..';
import { classes, getContentClassName } from '../../utils';
import { Period, SafeRecord } from '../../types';

import './stylesheet.scss';

export type Day = 'M' | 'T' | 'W' | 'R' | 'F';

export function isDay(rawDay: string): rawDay is Day {
  switch (rawDay) {
    case 'M':
    case 'T':
    case 'W':
    case 'H':
    case 'F':
      return true;
    default:
      return false;
  }
}

export interface CourseDateItem {
  id: string;
  title: string;
  times: Period | undefined;
  daysOfWeek: string[];
}

export type DaySelectionProps = {
  courseDateMap: SafeRecord<Day, CourseDateItem[]>;
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
    if (Math.floor(time / 60) >= 12) {
      const adjustedHour = Math.floor(time / 60) % 12;
      const hour = adjustedHour === 0 ? '12' : adjustedHour;
      const minute = String(time % 60).padStart(2, '0');
      return `${hour}:${minute}pm`;
    }

    const hour = Math.floor(time / 60);
    const minute = String(time % 60).padStart(2, '0');
    return `${hour}:${minute}am`;
  };

  return (
    <div className="date-container">
      {Object.keys(courseDateMap).map((date, i) => {
        if (!isDay(date)) return null;
        const courses = courseDateMap[date];
        return (
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
                    date !== activeDay ? setActiveDay(date) : setActiveDay('')
                }
              ]}
            />
            {activeDay === date && (
              <div className="dropdown-content">
                {courses == null || courses.length === 0 ? (
                  <div className="course-content" style={{ padding: 8 }}>
                    No classes this day!
                  </div>
                ) : (
                  courses.map((course) => {
                    let timeLabel = 'TBA';
                    const { times } = course;
                    if (times != null) {
                      const { start, end } = times;
                      timeLabel = `${formatTime(start)} - ${formatTime(end)}`;
                    }

                    return (
                      <div className="course-content">
                        <div className="course-id">{course.id}</div>
                        <span className="course-row">{course.title}</span>
                        <span className="course-row">
                          {course.daysOfWeek} {timeLabel}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
