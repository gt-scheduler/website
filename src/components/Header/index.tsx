import React, { useContext, useMemo } from 'react';

import { ScheduleContext, TermsContext } from '../../contexts';
import HeaderDisplay from '../HeaderDisplay';
import useHeaderActionBarProps from '../../hooks/useHeaderActionBarProps';
import { Term } from '../../types';

import './stylesheet.scss';

export type HeaderProps = {
  currentTab: number;
  onChangeTab: (newTab: number) => void;
  onToggleMenu: () => void;
  tabs: string[];
  captureRef: React.RefObject<HTMLDivElement>;
};

type VersionState = {
  type: 'loaded';
  currentVersion: string;
  allVersionNames: readonly { id: string; name: string }[];
  setCurrentVersion: (next: string) => void;
  addNewVersion: (name: string, select?: boolean) => string;
  deleteVersion: (id: string) => void;
  renameVersion: (id: string, newName: string) => void;
  cloneVersion: (id: string, newName: string) => void;
};

type TermsState = {
  type: 'loaded';
  terms: Term[];
  currentTerm: string;
  onChangeTerm: (next: string) => void;
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
  const termsState = useMemo(
    () => ({
      type: 'loaded',
      terms,
      currentTerm: term,
      onChangeTerm: setTerm,
    }),
    [setTerm, term, terms]
  ) as TermsState;

  const versionsState = useMemo(
    () => ({
      type: 'loaded',
      allVersionNames,
      currentVersion,
      setCurrentVersion,
      addNewVersion,
      deleteVersion,
      renameVersion,
      cloneVersion,
    }),
    [
      addNewVersion,
      allVersionNames,
      cloneVersion,
      currentVersion,
      deleteVersion,
      renameVersion,
      setCurrentVersion,
    ]
  ) as VersionState;

  return (
    <HeaderDisplay
      totalCredits={totalCredits}
      currentTab={currentTab}
      onChangeTab={onChangeTab}
      onToggleMenu={onToggleMenu}
      tabs={tabs}
      {...headerActionBarProps}
      termsState={termsState}
      versionsState={versionsState}
      skeleton={false}
    />
  );
}
