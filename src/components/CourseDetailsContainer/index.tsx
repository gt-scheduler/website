import React, { useContext } from 'react';

import { ScheduleContext } from '../../contexts';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function CourseDetailsContainer(): React.ReactElement {
  const [{ oscar, desiredCourses }] = useContext(ScheduleContext);

  if (desiredCourses.length === 0) {
    return (
      <div className="empty-container">
        {/* TODO: insert image here */}
        <span className="empty-title">Course Details</span>
        <span className="empty-description">Add courses to view details</span>
      </div>
    );
  }

  return (
    <div className="cards-container">
      {desiredCourses.map((course) => {
        return <CourseInfoCard course={oscar.courseMap[course]} />;
      })}
    </div>
  );
}
