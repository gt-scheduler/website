import React, { useContext, useState } from 'react';
import ago from 's-ago';

import { Button, Course, CourseAdd, Event, EventAdd } from '..';
import { ScheduleContext } from '../../contexts';
import CourseNavMenu from '../CourseNavMenu';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function CourseContainer(): React.ReactElement {
  const [{ oscar, events, desiredCourses }] = useContext(ScheduleContext);
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
        <div className="scroller">
          {events.map((event) => (
            <Event className="event" event={event} />
          ))}
          <EventAdd className="event-add" />
        </div>
      )}
      <Button
        className="updated-at"
        href="https://github.com/gt-scheduler/crawler-v2"
      >
        Course data fetched {ago(oscar.updatedAt)}
      </Button>
    </div>
  );
}
