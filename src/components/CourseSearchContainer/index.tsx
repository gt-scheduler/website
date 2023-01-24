import React from 'react';

import CourseSearch from '../CourseSearch';
import { Course as CourseBean } from '../../data/beans';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export type CourseSearchContainerProps = {
  onShow: (courseToAdd: CourseBean) => void;
};

export default function CourseSearchContainer({
  onShow,
}: CourseSearchContainerProps): React.ReactElement {
  return (
    <div className="CourseSearchContainer">
      <h3 className="label column-title">Search Course</h3>
      <div className="scroller">
        <CourseSearch onShow={onShow} />
      </div>
    </div>
  );
}
