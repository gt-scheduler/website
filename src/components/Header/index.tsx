import React, { useContext, useMemo } from 'react';

import { ScheduleContext, TermsContext } from '../../contexts';
import HeaderDisplay from '../HeaderDisplay';
import useHeaderActionBarProps from '../../hooks/useHeaderActionBarProps';

import './stylesheet.scss';

export type HeaderProps = {
  currentTab: number;
  onChangeTab: (newTab: number) => void;
  onToggleMenu: () => void;
  tabs: string[];
  captureRef: React.RefObject<HTMLDivElement>;
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
  captureRef,
}: HeaderProps): React.ReactElement {
  const [
    { term, oscar, pinnedCrns, allVersionNames, currentVersion },
    {
      setTerm,
      setCurrentVersion,
      addNewVersion,
      deleteVersion,
      renameVersion,
      cloneVersion,
    },
  ] = useContext(ScheduleContext);
  const terms = useContext(TermsContext);

  const totalCredits = useMemo(() => {
    return pinnedCrns.reduce((credits, crn) => {
      const crnSection = oscar.findSection(crn);
      return credits + (crnSection != null ? crnSection.credits : 0);
    }, 0);
  }, [pinnedCrns, oscar]);

  const headerActionBarProps = useHeaderActionBarProps(captureRef);

  return (
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
        cloneVersion,
      }}
      skeleton={false}
    />
  );
}
