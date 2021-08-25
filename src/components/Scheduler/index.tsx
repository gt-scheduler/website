import React, { useMemo, useState } from 'react';
import { classes } from '../../utils';
import { Button, Calendar, CombinationContainer, CourseContainer } from '..';
import { OverlayCrnsContext, OverlayCrnsContextValue } from '../../contexts';
import { useMobile } from '../../hooks';

/**
 * Wraps around the root top-level component of the Scheduler tab
 */
const Scheduler = () => {
  const mobile = useMobile();

  // Store the current set of CRNs that are shown on the Calendar overlay
  const [overlayCrns, setOverlayCrns] = useState<string[]>([]);

  // Control second-level navigation between panes on mobile
  const [tabIndex, setTabIndex] = useState<number>(0);

  // Memoize the CRN overlay set's context value so it is stable
  const overlayContextValue = useMemo<OverlayCrnsContextValue>(
    () => [overlayCrns, setOverlayCrns],
    [overlayCrns, setOverlayCrns]
  );

  return (
    <>
      {mobile && (
        <div className="tab-container">
          {['Courses', 'Combinations', 'Calendar'].map((tabTitle, i) => (
            <Button
              key={tabTitle}
              className={classes('tab', tabIndex === i && 'active')}
              onClick={() => setTabIndex(i)}
            >
              {tabTitle}
            </Button>
          ))}
        </div>
      )}
      <OverlayCrnsContext.Provider value={overlayContextValue}>
        <div className="main">
          {(!mobile || tabIndex === 0) && <CourseContainer />}
          {(!mobile || tabIndex === 1) && <CombinationContainer />}
          {(!mobile || tabIndex === 2) && (
            <div className="calendar-container">
              <Calendar className="calendar" overlayCrns={overlayCrns} />
            </div>
          )}
        </div>
      </OverlayCrnsContext.Provider>
    </>
  );
};

export default Scheduler;
