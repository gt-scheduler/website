import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faDownload,
  faCalendarAlt,
  faPaste,
  faAdjust,
  faCaretDown,
  faUser,
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
import { classes } from '../../utils/misc';
import { DropdownMenu, DropdownMenuAction } from '../Select';

import './stylesheet.scss';

export type HeaderActionBarProps = {
  className?: string;
  style?: React.CSSProperties;
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

      <DropdownMenu items={[]}>
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
            {/* <span
              style={{
                fontSize: 19,
                fontWeight: 400,
                textShadow: '0 0 6px rgba(0,0,0,0.5)',
                color: 'white',
              }}
            >
              JA
            </span> */}
            <FontAwesomeIcon
              fixedWidth
              icon={faUser}
              style={{
                fontSize: '1.2rem',
                filter: 'drop-shadow(0 0 6px rgb(0,0,0,0.5))',
                color: 'white',
              }}
            />
            {/* <span style={{ fontSize: 20, fontWeight: 300 }}>JA</span> */}
          </div>
          <FontAwesomeIcon fixedWidth icon={faCaretDown} />
        </div>
      </DropdownMenu>
    </div>
  );
}

// <Button onClick={onDownloadCalendar} disabled={!enableDownloadCalendar}>
//         <FontAwesomeIcon className="icon" fixedWidth icon={faDownload} />
//         <div className="text">Download</div>
//       </Button>
//       <Button onClick={onExportCalendar} disabled={!enableExportCalendar}>
//         <FontAwesomeIcon className="icon" fixedWidth icon={faCalendarAlt} />
//         <div className="text">Export</div>
//       </Button>

//       {/* Include separate button and tooltip component
//           with manually controlled closing logic */}
//       <div
//         className="menu"
//         data-tip
//         data-for="copy-crn"
//         delay-hide="1000"
//         ref={crnButton}
//       >
//         <Button disabled={!enableCopyCrns}>
//           <FontAwesomeIcon className="icon" fixedWidth icon={faPaste} />
//           <div className="text">CRNs</div>
//         </Button>
//       </div>
//       {enableCopyCrns && (
//         <ReactTooltip
//           id="copy-crn"
//           type="dark"
//           place="bottom"
//           effect="solid"
//           event="click"
//           delayHide={1000}
//           afterShow={(): void => {
//             onCopyCrns();
//             setTimeout(
//               () => ReactTooltip.hide(crnButton?.current ?? undefined),
//               1000
//             );
//           }}
//         >
//           Copied to clipboard!
//         </ReactTooltip>
//       )}
