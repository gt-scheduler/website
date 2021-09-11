import React, { useCallback, useContext, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAdjust,
  faBars,
  faCalendarAlt,
  faDownload,
  faPaste,
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import Cookies from 'js-cookie';
import ReactTooltip from 'react-tooltip';

import { getSemesterName } from '../../utils/misc';
import { Button, Select, Tab } from '..';
import { useMobile } from '../../hooks';
import { ThemeContext } from '../../contexts';
import { LoadingSelect } from '../Select';
import Spinner from '../Spinner';

import './stylesheet.scss';

export type HeaderDisplayProps = {
  totalCredits?: number | null;
  currentTab: number;
  onChangeTab: (newTab: number) => void;
  onToggleMenu: () => void;
  tabs: string[];
  onCopyCrns?: () => void;
  enableCopyCrns?: boolean;
  onExportCalendar?: () => void;
  enableExportCalendar?: boolean;
  onDownloadCalendar?: () => void;
  enableDownloadCalendar?: boolean;
  termsState:
    | { type: 'loading' }
    | {
        type: 'loaded';
        terms: string[];
        currentTerm: string;
        onChangeTerm: (next: string) => void;
      };
};

/**
 * Renders the top header component as a simple display component,
 * letting any substantive state be passed in as props.
 * See `<Header>` for the full implementation that owns the header state.
 * This is safe to render without `TermContext` or `TermsContext` being present.
 */
export default function HeaderDisplay({
  totalCredits = null,
  currentTab,
  onChangeTab,
  onToggleMenu,
  tabs,
  onCopyCrns = (): void => undefined,
  enableCopyCrns = false,
  onExportCalendar = (): void => undefined,
  enableExportCalendar = false,
  onDownloadCalendar = (): void => undefined,
  enableDownloadCalendar = false,
  termsState,
}: HeaderDisplayProps): React.ReactElement {
  const [theme, setTheme] = useContext(ThemeContext);

  const handleThemeChange = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    Cookies.set('theme', newTheme, { expires: 1460 });
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Obtain a ref to the copy button to only close its tooltip
  const crnButton = useRef<HTMLDivElement>(null);

  // Re-render when the page is re-sized to become mobile/desktop
  // (desktop is >= 1024 px wide)
  const mobile = useMobile();
  return (
    <div className="Header">
      {/* Menu button, only displayed on mobile */}
      {mobile && (
        <Button className="nav-menu-button" onClick={onToggleMenu}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faBars} />
        </Button>
      )}

      {/* Left-aligned logo */}
      <Button className="logo">
        <span className="gt">GT </span>
        <span className="scheduler">Scheduler</span>
      </Button>

      {/* Term selector */}
      {termsState.type === 'loaded' ? (
        <Select
          onChange={termsState.onChangeTerm}
          value={termsState.currentTerm}
          options={termsState.terms.map((currentTerm) => ({
            value: currentTerm,
            label: getSemesterName(currentTerm),
          }))}
          className="semester"
        />
      ) : (
        <LoadingSelect />
      )}

      <span className="credits">
        {totalCredits === null ? (
          <Spinner size="small" style={{ marginRight: 8 }} />
        ) : (
          totalCredits
        )}{' '}
        Credits
      </span>

      {/* Include middle-aligned tabs on desktop */}
      {!mobile && (
        <div className="tabs">
          {tabs.map((tabLabel, tabIdx) => (
            <Tab
              key={tabIdx}
              active={tabIdx === currentTab}
              onClick={(): void => onChangeTab(tabIdx)}
              label={tabLabel}
            />
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="menu">
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
                () => ReactTooltip.hide(crnButton.current ?? undefined),
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
    </div>
  );
}
