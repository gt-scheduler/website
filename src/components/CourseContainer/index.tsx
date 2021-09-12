import React, { useContext } from 'react';
import ago from 's-ago';

import { Button, Course, CourseAdd } from '..';
import { ScheduleContext } from '../../contexts';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function CourseContainer(): React.ReactElement {
  const [{ oscar, desiredCourses }] = useContext(ScheduleContext);

  return (
    <div className="CourseContainer">
      <div className="scroller">
        <div className="course-list">
          {desiredCourses.map((courseId) => {
            return <Course courseId={courseId} key={courseId} />;
          })}
        </div>
        <CourseAdd className="course-add" />
      </div>
      <Button
        className="updated-at"
        href="https://github.com/gt-scheduler/crawler"
      >
        Course data fetched {ago(oscar.updatedAt)}
      </Button>
    </div>
  );
}
