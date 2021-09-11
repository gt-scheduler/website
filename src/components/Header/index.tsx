import React, { useCallback, useContext, useMemo, useRef } from 'react';
import copy from 'copy-to-clipboard';

import {
  downloadShadowCalendar,
  exportCoursesToCalendar,
} from '../../utils/misc';
import { Calendar } from '..';
import { TermContext, TermsContext, ThemeContext } from '../../contexts';
import { ErrorWithFields, softError } from '../../log';
import HeaderDisplay from '../HeaderDisplay';

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
  const [{ term, oscar, pinnedCrns }, { setTerm }] = useContext(TermContext);
  const terms = useContext(TermsContext);
  const [theme] = useContext(ThemeContext);
  const captureRef = useRef<HTMLDivElement>(null);

  const totalCredits = useMemo(() => {
    return pinnedCrns.reduce((credits, crn) => {
      const crnSection = oscar.findSection(crn);
      return credits + (crnSection != null ? crnSection.credits : 0);
    }, 0);
  }, [pinnedCrns, oscar]);

  const handleExport = useCallback(() => {
    try {
      exportCoursesToCalendar(oscar, pinnedCrns);
    } catch (err) {
      softError(
        new ErrorWithFields({
          message: 'exporting courses to calendar failed',
          fields: {
            pinnedCrns,
            term: oscar.term,
          },
        })
      );
    }
  }, [oscar, pinnedCrns]);

  const handleDownload = useCallback(() => {
    const captureElement = captureRef.current;
    if (captureElement == null) return;
    try {
      downloadShadowCalendar(captureElement, theme);
    } catch (err) {
      softError(
        new ErrorWithFields({
          message: 'downloading shadow calendar as PNG failed',
          fields: {
            pinnedCrns,
            theme,
            term: oscar.term,
          },
        })
      );
    }
  }, [captureRef, theme, pinnedCrns, oscar.term]);

  const handleCopyCrns = useCallback(() => {
    try {
      copy(pinnedCrns.join(', '));
    } catch (err) {
      softError(
        new ErrorWithFields({
          message: 'copying CRNs to clipboard failed',
          fields: {
            pinnedCrns,
            term: oscar.term,
          },
        })
      );
    }
  }, [pinnedCrns, oscar.term]);

  return (
    <>
      <HeaderDisplay
        totalCredits={totalCredits}
        currentTab={currentTab}
        onChangeTab={onChangeTab}
        onToggleMenu={onToggleMenu}
        tabs={tabs}
        onCopyCrns={handleCopyCrns}
        enableCopyCrns={pinnedCrns.length > 0}
        onExportCalendar={handleExport}
        enableExportCalendar={pinnedCrns.length > 0}
        onDownloadCalendar={handleDownload}
        enableDownloadCalendar={pinnedCrns.length > 0}
        termsState={{
          type: 'loaded',
          terms,
          currentTerm: term,
          onChangeTerm: setTerm,
        }}
      />

      {/* Fake calendar used to capture screenshots */}
      <div className="capture-container" ref={captureRef}>
        <Calendar className="fake-calendar" capture overlayCrns={[]} />
      </div>
    </>
  );
}
