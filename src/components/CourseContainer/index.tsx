import React, { useContext, useState } from 'react';
import ago from 's-ago';

import { Button, Course, CourseAdd } from '..';
import { ScheduleContext } from '../../contexts';
import CourseNavMenu from '../CourseNavMenu';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function CourseContainer(): React.ReactElement {
  const [{ oscar, desiredCourses }] = useContext(ScheduleContext);
  const courseTabs = ['Courses', 'Recurring Events'];
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <div className="CourseContainer">
      <CourseNavMenu
        items={courseTabs}
        currentItem={currentTab}
        onChangeItem={setCurrentTab}
      />
      {courseTabs[currentTab] === courseTabs[0] ? (
        <div className="scroller">
          <div className="course-list">
            {desiredCourses.map((courseId) => {
              return <Course courseId={courseId} key={courseId} />;
            })}
          </div>
          <CourseAdd className="course-add" />
        </div>
      ) : (
        <div className="scroller" />
      )}
      <Button
        className="updated-at"
        href="https://github.com/gt-scheduler/crawler"
      >
        Course data fetched {ago(oscar.updatedAt)}
      </Button>
    </div>
  );
}
