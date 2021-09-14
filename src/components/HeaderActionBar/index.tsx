import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faDownload,
  faCalendarAlt,
  faPaste,
  faAdjust,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useRef } from 'react';
import ReactTooltip from 'react-tooltip';

import { Button } from '..';
import { ThemeContext } from '../../contexts';
import { classes } from '../../utils/misc';

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

  // Obtain a ref to the copy button to only close its tooltip
  const crnButton = useRef<HTMLDivElement>(null);

  return (
    <div className={classes('header-action-bar', className)} style={style}>
      <Button onClick={onDownloadCalendar} disabled={!enableDownloadCalendar}>
        <FontAwesomeIcon className="icon" fixedWidth icon={faDownload} />
        <div className="text">Download</div>
      </Button>
      <Button onClick={onExportCalendar} disabled={!enableExportCalendar}>
        <FontAwesomeIcon className="icon" fixedWidth icon={faCalendarAlt} />
        <div className="text">Export</div>
      </Button>

      {/* Include separate button and tooltip component
          with manually controlled closing logic */}
      <div
        className="menu"
        data-tip
        data-for="copy-crn"
        delay-hide="1000"
        ref={crnButton}
      >
        <Button disabled={!enableCopyCrns}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faPaste} />
          <div className="text">CRNs</div>
        </Button>
      </div>
      {enableCopyCrns && (
        <ReactTooltip
          id="copy-crn"
          type="dark"
          place="bottom"
          effect="solid"
          event="click"
          delayHide={1000}
          afterShow={(): void => {
            onCopyCrns();
            setTimeout(
              () => ReactTooltip.hide(crnButton?.current ?? undefined),
              1000
            );
          }}
        >
          Copied to clipboard!
        </ReactTooltip>
      )}

      <Button onClick={handleThemeChange}>
        <FontAwesomeIcon className="icon" fixedWidth icon={faAdjust} />
        <div className="text">Theme</div>
      </Button>
      <Button href="https://github.com/gt-scheduler/website">
        <FontAwesomeIcon className="icon" fixedWidth icon={faGithub} />
        <div className="text">GitHub</div>
      </Button>
    </div>
  );
}
