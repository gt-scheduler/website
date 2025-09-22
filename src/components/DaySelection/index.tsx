import React, { useContext } from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';

import { ActionRow } from '..';
import { classes, getContentClassName } from '../../utils/misc';
import { Period } from '../../types';
import { ThemeContext } from '../../contexts';

import './stylesheet.scss';

export type Day = 'ALL' | 'M' | 'T' | 'W' | 'R' | 'F';

export function isDay(rawDay: string): rawDay is Day {
  switch (rawDay) {
    case 'ALL':
    case 'M':
    case 'T':
    case 'W':
    case 'R':
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
  courseDateMap: Record<Day, CourseDateItem[]>;
  activeDay: Day | '';
  setActiveDay: (next: Day | '') => void;
};

const LIGHT_COLOR_PALETTE = [
  '#D3C5E3',
  '#FCB9AA',
  '#FFDBCC',
  '#ECEAE4',
  '#A2E1DB',
  '#55CBCD',
];
const DARK_COLOR_PALETTE = [
  '#433b4a',
  '#5e3931',
  '#704737',
  '#685a30',
  '#3c6962',
  '#286061',
];

export default function DaySelection({
  courseDateMap,
  activeDay,
  setActiveDay,
}: DaySelectionProps): React.ReactElement {
  const daysOfTheWeek = [
    'All Days',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  // Switch the color palette based on the current theme.
  const [theme] = useContext(ThemeContext);
  const colorPalette =
    theme === 'dark' ? DARK_COLOR_PALETTE : LIGHT_COLOR_PALETTE;

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
              label={daysOfTheWeek[i] ?? ''}
              className="day-select"
              actions={[
                {
                  icon: date === activeDay ? faAngleUp : faAngleDown,
                  onClick: (): void =>
                    date !== activeDay ? setActiveDay(date) : setActiveDay(''),
                },
              ]}
            />
            {activeDay === date && (
              <div className="dropdown-content">
                {courses == null || courses.length === 0 ? (
                  <div className="course-content" style={{ padding: 8 }}>
                    {activeDay === 'ALL'
                      ? 'No classes this week!'
                      : 'No classes this day!'}
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
                      <div className="course-content" key={course.id}>
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
