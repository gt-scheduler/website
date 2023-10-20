import React, { useState, useContext, useId, useCallback } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';

import { CombinationContainer, ComparisonContainer } from '..';
import { AccountContext } from '../../contexts/account';
import { classes } from '../../utils/misc';
import Modal from '../Modal';

import './stylesheet.scss';

export type ComparisonPanelProps = {
  handleCompareSchedules: (
    compare?: boolean,
    pinnedSchedules?: string[],
    pinSelf?: boolean
  ) => void;
  pinnedSchedules: string[];
  pinSelf: boolean;
};

export default function ComparisonPanel({
  handleCompareSchedules,
  pinnedSchedules,
  pinSelf,
}: ComparisonPanelProps): React.ReactElement {
  const [expanded, setExpanded] = useState(true);
  const [hover, setHover] = useState(false);
  const [tooltipY, setTooltipY] = useState(0);
  const [signedInModal, setSignedInModal] = useState(false);
  const [compare, setCompare] = useState(false);
  // const [hoverCompare, setHoverCompare] = useState(false);
  // const [tooltipYCompare, setTooltipYCompare] = useState(0);
  const tooltipId = useId();

  const { type } = useContext(AccountContext);

  const handleHover = useCallback((e: React.MouseEvent) => {
    setHover(true);
    setTooltipY(e.clientY);
  }, []);

  const handleTogglePanel = useCallback(() => {
    if (type === 'signedIn') {
      setCompare(!compare);
      handleCompareSchedules(!compare, undefined, undefined);
    } else {
      setSignedInModal(true);
    }
  }, [type, compare, handleCompareSchedules]);

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
        <div className="comparison-header">
          <p className="header-title">Compare Schedules</p>
          <p className="header-text">{compare ? 'On' : 'Off'}</p>
          <label className="switch" htmlFor="comparison-checkbox">
            <input
              className={classes(compare && 'checked')}
              type="checkbox"
              id="comparison-checkbox"
              onClick={(): void => handleTogglePanel()}
            />
            <div className="slider round" />
          </label>
        </div>
        {compare && (
          <ComparisonContainer
            handleCompareSchedules={handleCompareSchedules}
            pinnedSchedules={pinnedSchedules}
            pinSelf={pinSelf}
          />
        )}
        <div className="combination">
          <CombinationContainer compare={compare} />
        </div>
        {/* <div
          className={classes('comparison-overlay', 'left', compare && 'open')}
          id="comparison-overlay-left"
          onMouseEnter={(e: React.MouseEvent): void => {
            setHoverCompare(true);
            setTooltipYCompare(e.clientY);
          }}
        />
        <ReactTooltip
          key={tooltipYCompare}
          className="overlay-tooltip"
          variant="dark"
          anchorId="comparison-overlay-left"
          isOpen={hoverCompare}
          setIsOpen={setHoverCompare}
          delayShow={40}
          delayHide={100}
          offset={70 - tooltipYCompare}
          // key={deviceHasHover ? 0 : 1}
          // events={deviceHasHover ? ['hover'] : []}
        >
          <p>
            Turn off Compare Schedule
            <br />
            to access courses and events
          </p>
        </ReactTooltip> */}
        <Modal
          className="not-signed-in-modal"
          show={signedInModal}
          onHide={(): void => setSignedInModal(false)}
          buttons={[
            {
              label: 'Got it!',
              onClick: (): void => {
                setSignedInModal(false);
              },
            },
          ]}
          preserveChildrenWhileHiding
        >
          <p style={{ textAlign: 'center' }}>
            Users should sign in to use the Compare Schedules panel.
          </p>
        </Modal>
      </div>
    </div>
  );
}
