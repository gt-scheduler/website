import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faDownload,
  faCalendarAlt,
  faPaste,
  faCaretDown,
  faShare,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { Button, InvitationModal } from '..';
import {
  LARGE_MOBILE_BREAKPOINT,
  LARGE_DESKTOP_BREAKPOINT,
  DESKTOP_BREAKPOINT,
} from '../../constants';
import useMedia from '../../hooks/useMedia';
import { AccountContext, AccountContextValue } from '../../contexts/account';
import { classes } from '../../utils/misc';
import { DropdownMenu, DropdownMenuAction } from '../Select';
import AccountDropdown from '../AccountDropdown';
import ShareIcon from '../ShareIcon';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

export type HeaderActionBarProps = {
  className?: string;
  style?: React.CSSProperties;
  accountState: AccountContextValue | { type: 'loading' };
  onCopyCrns?: () => void;
  enableCopyCrns?: boolean;
  onExportCalendar?: () => void;
  enableExportCalendar?: boolean;
  onDownloadCalendar?: () => void;
  enableDownloadCalendar?: boolean;
};

// Key to mark when a user has already seen the invite modal.
const MODAL_LOCAL_STORAGE_KEY = '2023-05-10-spr2023-invite-modal';

/**
 * Displays the icon buttons (with optional text)
 * that appear at the top of the app in the header,
 * or if on a small mobile device, at the top of the app nav drawer,
 * This component is a simple display component,
 * letting any substantive state be passed in as props.
 */
export default function HeaderActionBar({
  className,
  style,
  accountState,
  onCopyCrns = (): void => undefined,
  enableCopyCrns = false,
  onExportCalendar = (): void => undefined,
  enableExportCalendar = false,
  onDownloadCalendar = (): void => undefined,
  enableDownloadCalendar = false,
}: HeaderActionBarProps): React.ReactElement {
  const { type } = useContext(AccountContext);

  const [invitationOpen, setInvitationOpen] = useState(false);
  const [seenInviteModal, setSeenInviteModal] = useLocalStorageState<boolean>(
    MODAL_LOCAL_STORAGE_KEY,
    {
      defaultValue: false,
      storageSync: true,
    }
  );

  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  const openInvitation = useCallback(() => {
    setInvitationOpen(true);
    if (!seenInviteModal) {
      setSeenInviteModal(true);
    }
  }, [seenInviteModal, setSeenInviteModal]);
  const hideInvitation = useCallback(() => setInvitationOpen(false), []);

  // Coalesce the export options into the props for a single <DropdownMenu>
  const enableExport =
    enableCopyCrns || enableDownloadCalendar || enableExportCalendar;
  const exportActions: DropdownMenuAction[] = [];
  if (enableDownloadCalendar) {
    exportActions.push({
      label: 'Download image',
      icon: faDownload,
      onClick: onDownloadCalendar,
      id: 'export-download',
    });
  }
  if (enableExportCalendar) {
    exportActions.push({
      label: 'ICS (Calendar) file',
      icon: faCalendarAlt,
      onClick: onExportCalendar,
      id: 'export-calendar',
    });
  }
  if (enableCopyCrns) {
    exportActions.push({
      label: 'Copy CRNs to clipboard',
      icon: faPaste,
      onClick: onCopyCrns,
      id: 'export-copy-crn',
    });
  }

  // On small mobile screens and on large desktop,
  // left-anchor the "Export" dropdown.
  // Otherwise, anchor it to the right.
  const lowerBound = LARGE_MOBILE_BREAKPOINT;
  const upperBound = LARGE_DESKTOP_BREAKPOINT;
  const shouldRightAnchorExportDropdown = useMedia(
    `(min-width: ${lowerBound}px) and (max-width: ${upperBound}px)`
  );

  return (
    <div className={classes('header-action-bar', className)} style={style}>
      <DropdownMenu
        disabled={!enableExport}
        items={exportActions}
        menuAnchor={shouldRightAnchorExportDropdown ? 'right' : 'left'}
        className="header-action-bar__button"
      >
        <div className="header-action-bar__export-dropdown-content">
          <ShareIcon className="header-action-bar__button-icon" />
          <div className="header-action-bar__button-text">Export</div>
          <FontAwesomeIcon fixedWidth icon={faCaretDown} />
        </div>
      </DropdownMenu>
      <InvitationModal show={invitationOpen} onHide={hideInvitation} />

      {!mobile && (
        <Button
          onClick={openInvitation}
          disabled={type === 'signedOut'}
          className={classes('header-action-bar__button', 'invite-button')}
        >
          <FontAwesomeIcon
            className="header-action-bar__button-icon"
            fixedWidth
            icon={faShare}
          />
          <div className="header-action-bar__button-text">Invite</div>
          {seenInviteModal || type === 'signedOut' ? null : (
            <FontAwesomeIcon className="circle" fixedWidth icon={faCircle} />
          )}
        </Button>
      )}

      <Button
        href="https://github.com/gt-scheduler/website"
        className="header-action-bar__button"
      >
        <FontAwesomeIcon
          className="header-action-bar__button-icon"
          fixedWidth
          icon={faGithub}
        />
        <div className="header-action-bar__button-text">GitHub</div>
      </Button>

      <AccountDropdown state={accountState} />
    </div>
  );
}
