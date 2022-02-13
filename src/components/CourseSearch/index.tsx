import React, { useState } from 'react';
import { DESKTOP_BREAKPOINT } from '../../constants';
import { classes } from '../../utils/misc';
import useScreenWidth from '../../hooks/useScreenWidth';
import CurrentCourseContainer from '../CurrentCourseContainer';
import SearchContainer from '../SearchContainer';
import SearchResultContainer from '../SearchResultContainer';
import { Button, Calendar, CombinationContainer, CourseContainer } from '..';

export default function CourseSearch(): React.ReactElement {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);
  const [tabIndex, setTabIndex] = useState<number>(0);

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
        {(!mobile || tabIndex === 1) && <SearchContainer />}
        {(!mobile || tabIndex === 2) && <SearchResultContainer />}
      </div>
    </>
  );
}
