import React, { useContext } from 'react';
import ago from 's-ago';

import { Button, Course, CourseAdd, Event, EventAdd } from '..';
import { ScheduleContext } from '../../contexts';
import CourseNavMenu from '../CourseNavMenu';
import { COURSE_TABS, COURSES } from '../../constants';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function CourseContainer(): React.ReactElement {
  const [
    { oscar, events, desiredCourses, courseContainerTab },
    { setCourseContainerTab },
  ] = useContext(ScheduleContext);

  return (
    <div className="CourseContainer">
      <CourseNavMenu
        items={COURSE_TABS}
        currentItem={courseContainerTab}
        onChangeItem={setCourseContainerTab}
      />
      {COURSE_TABS[courseContainerTab] === COURSE_TABS[COURSES] ? (
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
