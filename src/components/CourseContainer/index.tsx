import React, { useContext, useState } from 'react';
import ago from 's-ago';

import { Button, Course, CourseAdd, Event, EventAdd } from '..';
import { ScheduleContext } from '../../contexts';
import CourseNavMenu from '../CourseNavMenu';
// all changes in this file are for testing purposes
import { auth } from '../../data/firebase';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function CourseContainer(): React.ReactElement {
  const [{ term, currentVersion, oscar, events, desiredCourses }] =
    useContext(ScheduleContext);
  const [email, setEmail] = useState('');
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
        href="https://github.com/gt-scheduler/crawler"
      >
        Course data fetched {ago(oscar.updatedAt)}
      </Button>
      <input
        value={email}
        onChange={(e): void => setEmail(e.target.value)}
        placeholder="Enter email..."
      />
      <Button
        onClick={async () => {
          const fetchRes = await fetch(
            'http://127.0.0.1:5001/gt-scheduler-web-prod/us-central1/createFriendInvitation',
            {
              method: 'POST',
              body: JSON.stringify({
                IDToken: await auth.currentUser?.getIdToken(),
                friendEmail: email,
                term,
                version: currentVersion,
              }),
            }
          ).then((res) => res.json());
          console.log(fetchRes);
        }}
      >
        Test Email
      </Button>
    </div>
  );
}
