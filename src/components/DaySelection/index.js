import React, { useContext, useEffect } from 'react';
import { TermContext } from '../../contexts';

export function DaySelection() {
  const [{ oscar, pinnedCrns }] = useContext(TermContext);
  let courseDateMap = {
    M: [],
    T: [],
    W: [],
    R: [],
    F: []
  };

  useEffect(() => {
    pinnedCrns.forEach((crn) => {
      const section = oscar.findSection(crn);
      console.log(section);
      return section.meetings.forEach(
        (meeting) =>
          meeting.period &&
          meeting.days.map((day) => {
            courseDateMap[day].push({
              id: section.course.id,
              title: section.course.title,
              times: meeting.period
            });
          })
      );
    });
  }, []);

  console.log(courseDateMap);

  return (
    <div>
      {Object.keys(courseDateMap).map((date) => (
        <div>
          <p>{date}</p>
          {courseDateMap[date].map((course) => (
            <div>
              <div className="meeting-wrapper">
                <div className="ids">
                  <span className="course-id">{course.id}</span>
                  <span className="section-id">&nbsp;{course.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
