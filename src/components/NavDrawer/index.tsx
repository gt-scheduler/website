import React from 'react';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { classes } from '../../utils/misc';
import { Button } from '..';

import './stylesheet.scss';

export type NavDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Renders a nav drawer and the overlay when it is open
 */
export default function NavDrawer({
  open,
  onClose,
  children,
}: NavDrawerProps): React.ReactElement {
  return (
    <>
      <div
        className={classes('drawer-overlay', open && 'open')}
        tabIndex={-1}
        onClick={onClose}
        role="presentation"
      />
      <div className={classes('drawer-outer', open && 'open')}>
        <div className="drawer-header">
          <Button className="drawer-close" onClick={onClose}>
            <FontAwesomeIcon className="icon" fixedWidth icon={faTimes} />
          </Button>
        </div>
        {children}
      </div>
    </>
  );
}
