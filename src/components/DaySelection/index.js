import React, { useState } from 'react';

export function DaySelection({ courseDateMap }) {
  const [activeDay, setActiveDay] = useState('');

  const formatTime = (time) => {
    return (Math.floor(time / 60) % 12) + ':' + (time % 60);
  };

  // active course?
  // add a new div for each day of the week
  return (
    <div>
      {Object.keys(courseDateMap).map((date) => (
        <div className={`${date}-block`}>
          <div onClick={() => setActiveDay(date)}>{date}</div>
          <ul hidden={date !== activeDay ? true : false}>
            {courseDateMap[date].map((course) => (
              <li>
                <p className="course-id">{course.id}</p>
                <p className="course-title">{course.title}</p>
                <p className="course-times">
                  {formatTime(course.times.start)} -
                  {formatTime(course.times.end)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
