import React, { useState, useId, useCallback } from 'react';
import { CombinationContainer, ComparisonContainer } from '..';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { classes } from '../../utils/misc';
import './stylesheet.scss';

export default function ComparisonPanel(): React.ReactElement {
  const [expanded, setExpanded] = useState(true);
  const [hover, setHover] = useState(false);
  const [tooltipY, setTooltipY] = useState(0);
  const tooltipId = useId();

  const handleHover = useCallback(
    (e: React.MouseEvent) => {
      setHover(true);
      setTooltipY(e.clientY);
    },
    [hover, tooltipY]
  );

  return (
    <div className="comparison-panel">
      <div
        className="drawer"
        onClick={(): void => {
          setExpanded(!expanded);
          setHover(false);
        }}
        onMouseEnter={(e: React.MouseEvent): void => {
          handleHover(e);
        }}
        onMouseLeave={(): void => setHover(false)}
        id={tooltipId}
      >
        <div className="drawer-line" />
        <div className="icon">
          <div className={classes('arrow', expanded && 'right')} />
        </div>
        <div className="drawer-line" />
        <ReactTooltip
          key={tooltipY}
          anchorId={tooltipId}
          className="tooltip"
          variant="dark"
          isOpen={hover}
          setIsOpen={setHover}
          delayShow={20}
          delayHide={100}
          offset={70 - tooltipY}
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
