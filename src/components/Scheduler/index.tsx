import React, { useMemo, useCallback, useState } from 'react';

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

  const [compare, setCompare] = useState(false);
  const [pinnedSchedules, setPinnedSchedules] = useState<string[]>([]);
  const [pinSelf, setPinSelf] = useState(true);

  const handleCompareSchedules = useCallback(
    (
      newCompare?: boolean,
      newPinnedSchedules?: string[],
      newPinSelf?: boolean
    ) => {
      if (newCompare !== undefined) {
        setCompare(newCompare);
      }
      if (newPinnedSchedules !== undefined) {
        setPinnedSchedules(newPinnedSchedules);
      }
      if (newPinSelf !== undefined) {
        setPinSelf(newPinSelf);
      }
    },
    []
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
                pinnedFriendSchedules={pinnedSchedules}
                pinSelf={!compare || pinSelf}
              />
            </div>
          )}
          {(!mobile || tabIndex === 3) && (
            <ComparisonPanel
              handleCompareSchedules={handleCompareSchedules}
              pinnedSchedules={pinnedSchedules}
              pinSelf={pinSelf}
            />
          )}
        </div>
      </OverlayCrnsContext.Provider>
    </>
  );
}
