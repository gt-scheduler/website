import React, { useState, useId } from 'react';
import { CombinationContainer, ComparisonContainer } from '..';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { classes } from '../../utils/misc';
import './stylesheet.scss';

export default function ComparisonPanel(): React.ReactElement {
  const [expanded, setExpanded] = useState(true);
  const [hover, setHover] = useState(false);
  const tooltipId = useId();

  return (
    <div className="comparison-panel">
      <div
        className="drawer"
        onClick={(): void => {
          setExpanded(!expanded);
          setHover(false);
        }}
        onMouseEnter={(): void => setHover(true)}
        onMouseLeave={(): void => setHover(false)}
        id={tooltipId}
      >
        <div className="drawer-line" />
        <div className="icon">
          <div className={classes('arrow', expanded && 'right')} />
        </div>
        <div className="drawer-line" />
        <ReactTooltip
          anchorId={tooltipId}
          className="tooltip"
          variant="dark"
          clickable
          isOpen={hover}
          setIsOpen={setHover}
          delayShow={20}
          delayHide={100}
          float
          // key={deviceHasHover ? 0 : 1}
          // events={deviceHasHover ? ['hover'] : []}
        >
          <p>{expanded ? 'Collapse' : 'Expand for More Options'}</p>
        </ReactTooltip>
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
