import React from 'react';

import './stylesheet.scss';

export default function SearchContainer(): React.ReactElement {
  return (
    <div className="SearchContainer">
      <h3 className="label">Search for a course</h3>
      <div className="scroller" />
    </div>
  );
}
