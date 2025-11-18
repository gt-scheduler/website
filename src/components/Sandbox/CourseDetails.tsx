// TODO: Delete entire file and folder before merging

import React, { useContext, useEffect } from 'react';

import SectionDetailsContainer from '../SectionDetailsContainer';
import { ScheduleContext } from '../../contexts';
import { AppNavigationContext } from '../App/navigation';
import CourseDetailsContainer from '../CourseDetailsContainer';

export default function CourseDetailsSandbox(): React.ReactElement {
  const [{ oscar }] = useContext(ScheduleContext);
  const { currentSchedulerPage, setCurrentSchedulerPage } =
    useContext(AppNavigationContext);
  const course = oscar.findCourse('CS 1332');

  useEffect(() => {
    if (course) {
      setCurrentSchedulerPage({ type: 'section-details', course });
    }
  }, [course, setCurrentSchedulerPage]);

  if (!course) {
    return <div>no course found</div>;
  }

  return (
    <div>
      {currentSchedulerPage.type === 'section-details' && (
        <SectionDetailsContainer />
      )}
      {currentSchedulerPage.type === 'course-details' && (
        <CourseDetailsContainer />
      )}
    </div>
  );
}
