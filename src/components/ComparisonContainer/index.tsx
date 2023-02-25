import React, { useState } from 'react';
import { CombinationContainer } from '..';
import { classes } from '../../utils/misc';
import './stylesheet.scss';

export default function ComparisonContainer(): React.ReactElement {
  const [expanded, setExpanded] = useState(true);
  const [compare, setCompare] = useState(false);

  return (
    <>
      <div className="comparison-container">
        <div className="drawer" onClick={(): void => setExpanded(!expanded)}>
          <div className="drawer-line" />
          <div className="icon">
            <div className={classes('arrow', expanded && 'right')} />
          </div>
          <div className="drawer-line" />
        </div>
        <div className={classes('comparison-panel', !expanded && 'closed')}>
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
          <div className="combination">
            <CombinationContainer />
          </div>
        </div>
      </div>
      <div className={classes('comparison-overlay', compare && 'open')} />
    </>
  );
}
