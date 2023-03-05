import React, { useMemo, useState, useContext } from 'react';

import { classes } from '../../utils/misc';
import { Button, Calendar, CombinationContainer, CourseContainer } from '..';
import {
  OverlayCrnsContext,
  OverlayCrnsContextValue,
  ScheduleContext,
} from '../../contexts';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

/**
 * Wraps around the root top-level component of the Scheduler tab
 */
export default function Scheduler(): React.ReactElement {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  // Store the current set of CRNs that are shown on the Calendar overlay
  const [overlayCrns, setOverlayCrns] = useState<string[]>([]);

  // Control second-level navigation between panes on mobile
  const [tabIndex, setTabIndex] = useState<number>(0);

  // Memoize the CRN overlay set's context value so it is stable
  const overlayContextValue = useMemo<OverlayCrnsContextValue>(
    () => [overlayCrns, setOverlayCrns],
    [overlayCrns, setOverlayCrns]
  );

  const [{ oscar, desiredCourses, pinnedCrns }] = useContext(ScheduleContext);

  const filteredCourses = oscar.courses.filter((course) => {
    if (desiredCourses.includes(course.id)) {
      return course;
    }
    return '';
  });

  const finalFilteredCourses = filteredCourses.filter((course) => {
    let match;
    course.sections.forEach((section) => {
      if (
        section.campus !== 'Georgia Tech-Atlanta *' ||
        section.meetings[0]?.days.includes('S')
      ) {
        match = course;
      }
      return '';
    });
    return match;
  });

  return (
    <>
      {mobile && (
        <div className="tab-container">
          {['Courses', 'Combinations', 'Calendar'].map((tabTitle, i) => (
            <Button
              key={tabTitle}
              className={classes('tab', tabIndex === i && 'active')}
              onClick={(): void => setTabIndex(i)}
            >
              {tabTitle}
            </Button>
          ))}
        </div>
      )}
      <OverlayCrnsContext.Provider value={overlayContextValue}>
        <div className="main">
          {(!mobile || tabIndex === 0) && <CourseContainer />}
          {(!mobile || tabIndex === 1) && <CombinationContainer />}
          {(!mobile || tabIndex === 2) && (
            <div className="calendar-container">
              <Calendar className="calendar" overlayCrns={overlayCrns} />
              {finalFilteredCourses.length !== 0 ? (
                <div className="hidden-courses">
                  *Other Courses/Events not shown in view:{' '}
                  {finalFilteredCourses.map((course) => {
                    let sectionId = '';
                    pinnedCrns.filter((crn) => {
                      course.sections.every((section) => {
                        if (section.crn === crn) {
                          sectionId = section.id;
                        }
                        return 'i';
                      });
                      return 'j';
                    });
                    return `${course.id}(${sectionId}), `;
                  })}
                </div>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </OverlayCrnsContext.Provider>
    </>
  );
}
