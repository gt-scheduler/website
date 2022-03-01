import React from 'react';

import CourseSearch from '../CourseSearch';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function CourseSearchContainer(): React.ReactElement {
  return (
    <>
      <div className="CourseSearchContainer">
        <h3 className="label">Search for a course</h3>
        <div className="scroller">
          <CourseSearch />
        </div>
      </div>
    </>
  );
}
