import React, { useState, useContext, useId, useCallback } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { CombinationContainer, ComparisonContainer } from '..';
import { AccountContext } from '../../contexts/account';
import { classes } from '../../utils/misc';
import InvitationModal from '../InvitationModal';
import LoginModal from '../LoginModal';
import InvitationAcceptModal from '../InvitationAcceptModal/InvitationAcceptModal';

import './stylesheet.scss';

export type ComparisonPanelProps = {
  handleCompareSchedules: (
    compare?: boolean,
    pinnedSchedules?: string[],
    pinSelf?: boolean,
    expanded?: boolean,
    overlaySchedules?: string[]
  ) => void;
  pinnedSchedules: string[];
  compare: boolean;
  expanded: boolean;
};

export default function ComparisonPanel({
  handleCompareSchedules,
  pinnedSchedules,
  compare,
  expanded,
}: ComparisonPanelProps): React.ReactElement {
  const [hover, setHover] = useState(false);
  const [tooltipY, setTooltipY] = useState(0);
  const [invitationOpen, setInvitationOpen] = useState(false);
  // const [hoverCompare, setHoverCompare] = useState(false);
  // const [tooltipYCompare, setTooltipYCompare] = useState(0);
  const tooltipId = useId();
  const [loginOpen, setLoginOpen] = useState(false);
  const hideLogin = useCallback(() => setLoginOpen(false), []);

  const hideInvitation = useCallback(() => setInvitationOpen(false), []);

  const { type } = useContext(AccountContext);

  const handleHover = useCallback((e: React.MouseEvent) => {
    setHover(true);
    setTooltipY(e.clientY);
  }, []);

  const handleOpenInvitation = useCallback(() => {
    if (type === 'signedIn') {
      setInvitationOpen(true);
    } else {
      setLoginOpen(true);
    }
  }, [type]);

  const handleTogglePanel = useCallback(() => {
    if (type === 'signedIn') {
      handleCompareSchedules(!compare, undefined, undefined);
    } else {
      setLoginOpen(true);
    }
  }, [type, compare, handleCompareSchedules]);

  const [shareBackRemount, setShareBackRemount] = useState(0);

  return (
    <div className="comparison-panel">
      <InvitationAcceptModal
        handleCompareSchedules={handleCompareSchedules}
        setShareBackRemount={setShareBackRemount}
      />
      <div
        className={classes('drawer', expanded && 'opened')}
        onClick={(): void => {
          handleCompareSchedules(undefined, undefined, undefined, !expanded);
          setHover(false);
        }}
        onMouseEnter={(e: React.MouseEvent): void => {
          handleHover(e);
        }}
        onMouseLeave={(): void => setHover(false)}
        id={tooltipId}
      >
        <div className={classes('drawer-line', expanded && 'opened')} />
        <div className="icon">
          <div className={classes('arrow', expanded && 'right')} />
        </div>
        <div className={classes('drawer-line', expanded && 'opened')} />
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
        <InvitationModal show={invitationOpen} onHide={hideInvitation} />
        <div className="invite-panel">
          <button
            type="button"
            onClick={handleOpenInvitation}
            className="invite-button"
          >
            <FontAwesomeIcon fixedWidth icon={faShare} />
            <div>Share Schedule</div>
          </button>
        </div>
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
            shareBackRemount={shareBackRemount}
          />
        )}
        <div className="combination">
          <p className="content-title">Schedule Combinations</p>
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
        <LoginModal show={loginOpen} onHide={hideLogin} comparison />
      </div>
    </div>
  );
}
