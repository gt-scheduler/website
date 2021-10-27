import React, { useContext, useMemo, useRef } from 'react';

import { Calendar } from '..';
import { ScheduleContext, TermsContext } from '../../contexts';
import HeaderDisplay from '../HeaderDisplay';
import useHeaderActionBarProps from '../../hooks/useHeaderActionBarProps';

import './stylesheet.scss';

export type HeaderProps = {
  currentTab: number;
  onChangeTab: (newTab: number) => void;
  onToggleMenu: () => void;
  tabs: string[];
};

/**
 * Renders the top header component with all state/interactivity,
 * and includes controls for top-level tab-based navigation.
 * Acts as a wrapper around `<HeaderDisplay>` that provides all props.
 */
export default function Header({
  currentTab,
  onChangeTab,
  onToggleMenu,
  tabs,
}: HeaderProps): React.ReactElement {
  const [
    { term, oscar, pinnedCrns, allVersionNames, currentVersion },
    { setTerm, setCurrentVersion, addNewVersion, deleteVersion, renameVersion },
  ] = useContext(ScheduleContext);
  const terms = useContext(TermsContext);
  const captureRef = useRef<HTMLDivElement>(null);

  const totalCredits = useMemo(() => {
    return pinnedCrns.reduce((credits, crn) => {
      const crnSection = oscar.findSection(crn);
      return credits + (crnSection != null ? crnSection.credits : 0);
    }, 0);
  }, [pinnedCrns, oscar]);

  const headerActionBarProps = useHeaderActionBarProps();

  return (
    <>
      <HeaderDisplay
        totalCredits={totalCredits}
        currentTab={currentTab}
        onChangeTab={onChangeTab}
        onToggleMenu={onToggleMenu}
        tabs={tabs}
        {...headerActionBarProps}
        termsState={{
          type: 'loaded',
          terms,
          currentTerm: term,
          onChangeTerm: setTerm,
        }}
        versionsState={{
          type: 'loaded',
          allVersionNames,
          currentVersion,
          setCurrentVersion,
          addNewVersion,
          deleteVersion,
          renameVersion,
        }}
      />

      {/* Fake calendar used to capture screenshots */}
      <div className="capture-container" ref={captureRef}>
        <Calendar className="fake-calendar" capture overlayCrns={[]} />
      </div>
    </>
  );
}
