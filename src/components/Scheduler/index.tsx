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
import useLocalStorageState from 'use-local-storage-state';
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

  // const [{ currentTerm, versionStates }, setUIState] = useLocalStorageState(
  //   UI_STATE_LOCAL_STORAGE_KEY,
  //   {
  //     defaultValue: defaultUIState,
  //     storageSync: false,
  //   }
  // );

  const [compare, setCompare] = useLocalStorageState<boolean>(
    'compare-panel-state-compareValue',
    {
      defaultValue: false,
      storageSync: false,
    }
  );
  const [pinnedSchedules, setPinnedSchedules] = useLocalStorageState<string[]>(
    'compare-panel-state-pinnedSchedules',
    {
      defaultValue: [],
      storageSync: false,
    }
  );
  const [pinSelf, setPinSelf] = useLocalStorageState<boolean>(
    'compare-panel-state-pinSelfValue',
    {
      defaultValue: true,
      storageSync: false,
    }
  );

  console.log(compare);

  const handleCompareSchedules = useCallback(
    (
      newCompare?: boolean,
      newPinnedSchedules?: string[],
      newPinSelf?: boolean
    ) => {
      if (newCompare !== undefined) {
        console.log(newCompare);
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
              compare={compare}
            />
          )}
        </div>
      </OverlayCrnsContext.Provider>
    </>
  );
}
