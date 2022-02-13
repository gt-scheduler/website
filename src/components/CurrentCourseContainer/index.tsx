import React from 'react';
import './stylesheet.scss';

export default function CurrentCourseContainer(): React.ReactElement {
  return (
    <div className="CurrentCourseContainer">
      <h3 className="label">My courses</h3>
      <div className="scroller">
        <div className="default-icon">
          <div>
            <img
              src="/courseSearchDefault.png"
              alt="Course Search Default Icon"
              style={{ width: '120px', margin: '0 auto' }}
            />
          </div>
          <h3 className="label">My Courses</h3>
          <p>Courses you added will appear here!</p>
        </div>
      </div>
    </div>
  );
}
