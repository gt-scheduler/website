import React, { useContext } from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';

import { ActionRow } from '..';
import { classes, getContentClassName } from '../../utils/misc';
import { Period, Event } from '../../types';
import { ThemeContext } from '../../contexts';

import './stylesheet.scss';

export type Day = 'M' | 'T' | 'W' | 'R' | 'F';

export function isDay(rawDay: string): rawDay is Day {
  switch (rawDay) {
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
  section?: string;
  isEvent?: boolean;
}

export type DaySelectionProps = {
  courseDateMap: Record<Day, CourseDateItem[]>;
  unpicturedEvents: Event[];
  activeDay: Day | '';
  setActiveDay: (next: Day | '') => void;
};

const LIGHT_COLOR_PALETTE = [
  '#FCB9AA',
  '#FFDBCC',
  '#ECEAE4',
  '#A2E1DB',
  '#55CBCD',
];
const DARK_COLOR_PALETTE = [
  '#5e3931',
  '#704737',
  '#685a30',
  '#3c6962',
  '#286061',
];

export default function DaySelection({
  courseDateMap,
  unpicturedEvents,
  activeDay,
  setActiveDay,
}: DaySelectionProps): React.ReactElement {
  const daysOfTheWeek = [
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
                  <div className="course-content">No classes this day!</div>
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
                        <div className="course-id">
                          {course.isEvent ? course.title : course.id}
                        </div>
                        {!course.isEvent && (
                          <span className="course-row">{course.title}</span>
                        )}
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

      {/* Unpictured Events Section */}
      {unpicturedEvents.length > 0 && (
        <div className="unpictured-section">
          <div className="unpictured-header">*Sections not shown in map:</div>
          <div className="unpictured-content">
            {unpicturedEvents.map((event) => (
              <div key={event.id} className="unpictured-event">
                {event.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
