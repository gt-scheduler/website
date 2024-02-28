import React, { useMemo, useCallback, useState, useContext } from 'react';

import { classes } from '../../utils/misc';
import {
  Button,
  Calendar,
  CombinationContainer,
  ComparisonPanel,
  CourseContainer,
} from '..';
import { FriendContext, OverlayCrnsContext, OverlayCrnsContextValue } from '../../contexts';
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

  let [friendsData, friendsSetters] = useContext(FriendContext);

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
                compare={friendsData.compare}
              />
            </div>
          )}
          {(!mobile || tabIndex === 3) && (
            <ComparisonPanel
              compareState={friendsData.compare}
              setCompare={friendsSetters.setCompare}
              setPinned={friendsSetters.setPinned}
              setPinSelf={friendsSetters.setPinSelf}
            />
          )}
        </div>
      </OverlayCrnsContext.Provider>
    </>
  );
}
