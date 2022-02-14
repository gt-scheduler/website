import React from 'react';

import './stylesheet.scss';

export default function SearchResultContainer(): React.ReactElement {
  return (
    <div className="SearchResultContainer">
      <div className="default-icon">
        <div>
          <img
            src="/courseSearchResultDefault.png"
            alt="Course Search Result Default Icon"
            style={{ width: '120px', margin: '0 auto' }}
          />
        </div>
        <h3>Course Details</h3>
        <p>Look up a course and browse the details here!</p>
      </div>
    </div>
  );
}
