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
    {
      term,
      oscar,
      pinnedCrns,
      allVersionNames,
      currentVersion,
      adjustedCredits,
    },
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
    const adjustedCourses = new Set();
    return pinnedCrns.reduce((credits, crn) => {
      const crnSection = oscar.findSection(crn);
      if (
        crnSection !== undefined &&
        crnSection.adjustableCredits &&
        !adjustedCourses.has(`${crnSection.course.id}-${term}`)
      ) {
        adjustedCourses.add(`${crnSection.course.id}-${term}`);
        return (
          credits + (adjustedCredits[`${crnSection.course.id}-${term}`] ?? 1)
        );
      }
      if (!crnSection?.adjustableCredits) {
        return credits + (crnSection != null ? crnSection.credits : 0);
      }
      return credits;
    }, 0);
  }, [pinnedCrns, oscar, adjustedCredits, term]);

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
    />
  );
}
