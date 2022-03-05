import React, { useState, useCallback } from 'react';

import { DESKTOP_BREAKPOINT } from '../../constants';
import { classes } from '../../utils/misc';
import useScreenWidth from '../../hooks/useScreenWidth';
import CurrentCourseContainer from '../CurrentCourseContainer';
import CourseSearchContainer from '../CourseSearchContainer';
import SearchResultContainer from '../SearchResultContainer';
import { Course as CourseBean } from '../../data/beans';
import { Button } from '..';

export default function CourseSearch(): React.ReactElement {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);
  const [tabIndex, setTabIndex] = useState<number>(0);
  // TODO: Would be better to add a default CourseBean than have it undefined
  const [shownCourse, setShownCourse] = useState<CourseBean | undefined>();

  const handleShowInfo = useCallback((courseToShow: CourseBean) => {
    setShownCourse(courseToShow);
  }, []);

  return (
    <>
      {mobile && (
        <div className="tab-container">
          {['Current', 'Search', 'Result'].map((tabTitle, i) => (
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
      <div className="main">
        {(!mobile || tabIndex === 0) && <CurrentCourseContainer />}
        {(!mobile || tabIndex === 1) && (
          <CourseSearchContainer onShow={handleShowInfo} />
        )}
        {/* TODO: Change prop names to something meaningful and more concise */}
        {(!mobile || tabIndex === 2) && (
          <SearchResultContainer passedCourse={shownCourse} />
        )}
      </div>
    </>
  );
}
