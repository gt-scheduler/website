import React, { useState } from 'react';
import { CombinationContainer, ComparisonContainer } from '..';
import { classes } from '../../utils/misc';
import './stylesheet.scss';

export default function ComparisonPanel(): React.ReactElement {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="comparison-panel">
      <div className="drawer" onClick={(): void => setExpanded(!expanded)}>
        <div className="drawer-line" />
        <div className="icon">
          <div className={classes('arrow', expanded && 'right')} />
        </div>
        <div className="drawer-line" />
      </div>
      <div className={classes('panel', !expanded && 'closed')}>
        <ComparisonContainer />
        <div className="combination">
          <CombinationContainer />
        </div>
      </div>
    </div>
  );
}
