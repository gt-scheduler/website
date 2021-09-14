import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

import { getSemesterName } from '../../utils/semesters';
import { Button, Select, Tab } from '..';
import { LoadingSelect } from '../Select';
import Spinner from '../Spinner';
import { DESKTOP_BREAKPOINT, LARGE_MOBILE_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';
import HeaderActionBar from '../HeaderActionBar';

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
 * This is safe to render without `ScheduleContext` or `TermsContext`
 * being present.
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
  // Re-render when the page is re-sized to become mobile/desktop
  // (desktop is >= 1024 px wide)
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  // Re-render when the page is re-sized to be small mobile vs. greater
  // (small mobile is < 600 px wide)
  const largeMobile = useScreenWidth(LARGE_MOBILE_BREAKPOINT);
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

      {/* Include action bar on large mobile and higher */}
      {largeMobile && (
        <HeaderActionBar
          onCopyCrns={onCopyCrns}
          enableCopyCrns={enableCopyCrns}
          onExportCalendar={onExportCalendar}
          enableExportCalendar={enableExportCalendar}
          onDownloadCalendar={onDownloadCalendar}
          enableDownloadCalendar={enableDownloadCalendar}
        />
      )}
    </div>
  );
}
