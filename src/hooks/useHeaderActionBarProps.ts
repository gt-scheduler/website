import copy from 'copy-to-clipboard';
import React, { useContext, useCallback } from 'react';

import { HeaderActionBarProps } from '../components/HeaderActionBar';
import { ScheduleContext, ThemeContext } from '../contexts';
import { AccountContext } from '../contexts/account';
import { softError, ErrorWithFields } from '../log';
import { exportCoursesToCalendar, downloadShadowCalendar } from '../utils/misc';

export type HookResult = Pick<
  HeaderActionBarProps,
  | 'onCopyCrns'
  | 'enableCopyCrns'
  | 'onExportCalendar'
  | 'enableExportCalendar'
  | 'onDownloadCalendar'
  | 'enableDownloadCalendar'
  | 'accountState'
>;

/**
 * Custom hook to prepare a majority of the `<HeaderActionBar>` props.
 * Requires a valid value for `ScheduleContext`, `ThemeContext`,
 * and `AccountContext`.
 */
export default function useHeaderActionBarProps(
  captureRef: React.RefObject<HTMLDivElement>
): HookResult {
  const [{ oscar, pinnedCrns, events, term }] = useContext(ScheduleContext);
  const [theme] = useContext(ThemeContext);
  const accountState = useContext(AccountContext);

  const handleExport = useCallback(() => {
    try {
      exportCoursesToCalendar(oscar, pinnedCrns, events, term);
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
  }, [oscar, pinnedCrns, events, term]);

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

  return {
    onCopyCrns: handleCopyCrns,
    enableCopyCrns: pinnedCrns.length > 0,
    onExportCalendar: handleExport,
    enableDownloadCalendar: pinnedCrns.length > 0 || events.length > 0,
    onDownloadCalendar: handleDownload,
    enableExportCalendar: pinnedCrns.length > 0 || events.length > 0,
    accountState,
  };
}
