import React, { useState } from 'react';
import { CombinationContainer } from '..';
import { classes } from '../../utils/misc';
import './stylesheet.scss';

export default function ComparisonContainer(): React.ReactElement {
  const [compare, setCompare] = useState(false);

  return (
    <div className="comparison-container">
      <div className="comparison-body">
        <div className="comparison-header">
          <p className="header-title">Compare Schedules</p>
          <p className="header-text">{compare ? 'On' : 'Off'}</p>
          <label className="switch" htmlFor="comparison-checkbox">
            <input
              type="checkbox"
              id="comparison-checkbox"
              onClick={(): void => setCompare(!compare)}
            />
            <div className="slider round" />
          </label>
        </div>
        <div className="comparison-content">
          <div className="my-schedules">
            <p className="content-title">My Schedules</p>
          </div>
          <div className="shared-schedules">
            <p className="content-title">Shared with me</p>
          </div>
        </div>
      </div>
      <div className={classes('comparison-overlay', compare && 'open')} />
    </div>
  );
}
