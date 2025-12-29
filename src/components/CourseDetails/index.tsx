import React, { useContext } from 'react';

import { ScheduleContext } from '../../contexts';

import './stylesheet.scss';

export default function CourseDetails(): React.ReactElement {
  const [{ desiredCourses }] = useContext(ScheduleContext);

  if (desiredCourses.length === 0) {
    return (
      <div className="empty-container">
        <div className="empty-course-details">
          <img src="empty_course_details.svg" alt="Empty Course Details" />
          <span className="empty-title">Course Details</span>
          <span className="empty-description">Add courses to view details</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cards-container">
      {desiredCourses.map((course) => {
        return <span>course: {course}</span>;
      })}
    </div>
  );
}
