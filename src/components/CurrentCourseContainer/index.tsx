import React, { useContext } from 'react';

import MyCourse from '../MyCourse';
import { ScheduleContext, ThemeContext } from '../../contexts';

import './stylesheet.scss';

export default function CurrentCourseContainer(): React.ReactElement {
  const [{ desiredCourses }] = useContext(ScheduleContext);
  const [theme] = useContext(ThemeContext);

  const imageLink =
    theme === 'light'
      ? '/courseSearchDefaultLight.png'
      : '/courseSearchDefault.png';
  const imageAlt =
    theme === 'light' ? 'Course Search Default Light' : 'Course Search Default';

  return (
    <div className="CurrentCourseContainer">
      <h3 className="label column-title">My Courses</h3>
      <div className="scroller">
        {desiredCourses.length > 0 ? (
          <div className="course-list">
            {desiredCourses.map((courseId) => {
              return <MyCourse courseId={courseId} key={courseId} />;
            })}
          </div>
        ) : (
          <div className="default-icon">
            <div>
              <img
                src={imageLink}
                alt={imageAlt}
                style={{ width: '120px', margin: '0 auto' }}
              />
            </div>
            <h3 className="label">My Courses</h3>
          </div>
        )}
      </div>
    </div>
  );
}
