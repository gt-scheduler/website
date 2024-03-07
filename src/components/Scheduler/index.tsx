import React, { useCallback, useMemo, useState } from 'react';

import { classes } from '../../utils/misc';
import {
  Button,
  Calendar,
  CombinationContainer,
  ComparisonPanel,
  CourseContainer,
} from '..';
import { OverlayCrnsContext, OverlayCrnsContextValue } from '../../contexts';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useCompareStateFromStorage from '../../data/hooks/useCompareStateFromStorage';
import useScreenWidth from '../../hooks/useScreenWidth';

/**
 * Wraps around the root top-level component of the Scheduler tab
 */
export default function Scheduler(): React.ReactElement {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  // Store the current set of CRNs that are shown on the Calendar overlay
  const [overlayCrns, setOverlayCrns] = useState<string[]>([]);

  // Control second-level navigation between panes on mobile
  const [tabIndex, setTabIndex] = useState<number>(0);

  // Memoize the CRN overlay set's context value so it is stable
  const overlayContextValue = useMemo<OverlayCrnsContextValue>(
    () => [overlayCrns, setOverlayCrns],
    [overlayCrns, setOverlayCrns]
  );

  const { compare, pinned, pinSelf, setCompareState } =
    useCompareStateFromStorage();
  const [overlaySchedules, setOverlaySchedules] = useState<string[]>([]);

  const handleCompareSchedules = useCallback(
    (
      newCompare?: boolean,
      newPinnedSchedules?: string[],
      newPinSelf?: boolean,
      newOverlaySchedules?: string[]
    ) => {
      setCompareState(newCompare, newPinnedSchedules, newPinSelf);
      if (newOverlaySchedules !== undefined) {
        setOverlaySchedules(newOverlaySchedules);
      }
    },
    [setCompareState]
  );

  return (
    <>
      {mobile && (
        <div className="tab-container">
          {['Courses', 'Combinations', 'Calendar'].map((tabTitle, i) => (
            <Button
              key={tabTitle}
              className={classes('tab', tabIndex === i && 'active')}
              onClick={(): void => setTabIndex(i)}
            >
              {tabTitle}
            </Button>
          ))}
        </div>
      )}
      <OverlayCrnsContext.Provider value={overlayContextValue}>
        <div className="main">
          {(!mobile || tabIndex === 0) && <CourseContainer />}
          {mobile && tabIndex === 1 && <CombinationContainer />}
          {(!mobile || tabIndex === 2) && (
            <div className="calendar-container">
              <Calendar
                className="calendar"
                overlayCrns={overlayCrns}
                compare={compare}
                pinnedFriendSchedules={pinned}
                pinSelf={!compare || pinSelf}
                overlayFriendSchedules={overlaySchedules}
              />
            </div>
          )}
          {(!mobile || tabIndex === 3) && (
            <ComparisonPanel
              handleCompareSchedules={handleCompareSchedules}
              pinnedSchedules={pinned}
              pinSelf={pinSelf}
              compare={compare}
              overlaySchedules={overlaySchedules}
            />
          )}
        </div>
      </OverlayCrnsContext.Provider>
    </>
  );
}
