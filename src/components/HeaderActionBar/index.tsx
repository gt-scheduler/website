import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faDownload,
  faCalendarAlt,
  faPaste,
  faAdjust,
  faCaretDown,
  faUser,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext } from 'react';

import { Button } from '..';
import {
  LARGE_MOBILE_BREAKPOINT,
  LARGE_DESKTOP_BREAKPOINT,
} from '../../constants';
import { ThemeContext } from '../../contexts';
import useMedia from '../../hooks/useMedia';
import { AccountContextValue } from '../../contexts/account';
import { classes } from '../../utils/misc';
import { DropdownMenu, DropdownMenuAction } from '../Select';

import './stylesheet.scss';

export type HeaderActionBarProps = {
  className?: string;
  style?: React.CSSProperties;
  accountState: AccountContextValue;
  onCopyCrns?: () => void;
  enableCopyCrns?: boolean;
  onExportCalendar?: () => void;
  enableExportCalendar?: boolean;
  onDownloadCalendar?: () => void;
  enableDownloadCalendar?: boolean;
  handleThemeChange?: () => void;
};

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
  const [theme, setTheme] = useContext(ThemeContext);
  const handleThemeChange = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Coalesce the export options into the props for a single <DropdownMenu>
  const enableExport =
    enableCopyCrns || enableDownloadCalendar || enableExportCalendar;
  const exportActions: DropdownMenuAction[] = [];
  if (enableDownloadCalendar) {
    exportActions.push({
      label: 'Download image',
      icon: faDownload,
      onClick: onDownloadCalendar,
    });
  }
  if (enableExportCalendar) {
    exportActions.push({
      label: 'ICS (Calendar) file',
      icon: faCalendarAlt,
      onClick: onExportCalendar,
    });
  }
  // TODO add the tooltip back to this button
  if (enableCopyCrns) {
    exportActions.push({
      label: 'Copy CRNs to clipboard',
      icon: faPaste,
      onClick: onCopyCrns,
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
          <FontAwesomeIcon
            className="header-action-bar__button-icon"
            fixedWidth
            icon={faDownload}
          />
          <div className="header-action-bar__button-text">Export</div>
          <FontAwesomeIcon fixedWidth icon={faCaretDown} />
        </div>
      </DropdownMenu>

      <Button onClick={handleThemeChange} className="header-action-bar__button">
        <FontAwesomeIcon
          className="header-action-bar__button-icon"
          fixedWidth
          icon={faAdjust}
        />
        <div className="header-action-bar__button-text">Theme</div>
      </Button>
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

      <AccountDropDown state={accountState} />
    </div>
  );
}

// Private sub-components

type AccountDropDownProps = {
  state: AccountContextValue;
};

function AccountDropDown({ state }: AccountDropDownProps): React.ReactElement {
  // TODO clean up code
  const initials = state.signedIn ? getInitials(state.displayName) : '';
  return (
    <DropdownMenu
      menuAnchor="right"
      items={
        state.signedIn
          ? [
              {
                label: 'Sign out',
                icon: faSignOutAlt,
                onClick: (): void => state.signOut(),
              },
            ]
          : []
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            height: 40,
            width: 40,
            borderRadius: '10000px',
            backgroundColor: '#0C797D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
          }}
        >
          {state.signedIn ? (
            <span
              style={{
                fontSize:
                  initials.length <= 1 ? 22 : initials.length === 2 ? 19 : 17,
                fontWeight: 400,
                textShadow: '0 0 6px rgba(0,0,0,0.5)',
                color: 'white',
              }}
            >
              {initials.slice(0, 3)}
            </span>
          ) : (
            <FontAwesomeIcon
              fixedWidth
              icon={faUser}
              style={{
                fontSize: '1.2rem',
                filter: 'drop-shadow(0 0 6px rgb(0,0,0,0.5))',
                color: 'white',
              }}
            />
          )}
        </div>
        <FontAwesomeIcon fixedWidth icon={faCaretDown} />
      </div>
    </DropdownMenu>
  );
}

function getInitials(displayName: string): string {
  const regex = /\b\w/g;
  const matches = displayName.match(regex);
  if (matches === null) return '';
  return matches.join('');
}
