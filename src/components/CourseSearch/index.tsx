import React, { useState } from 'react';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';
import CurrentCourseContainer from '../CurrentCourseContainer';
import SearchContainer from '../SearchContainer';
import SearchResultContainer from '../SearchResultContainer';

export default function CourseSearch(): React.ReactElement {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);
  const [tabIndex, setTabIndex] = useState<number>(0);

  return (
    <>
      <div className="main">
        {(!mobile || tabIndex === 0) && <CurrentCourseContainer />}
        {(!mobile || tabIndex === 1) && <SearchContainer />}
        {(!mobile || tabIndex === 2) && <SearchResultContainer />}
      </div>
    </>
  );
}
