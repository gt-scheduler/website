import React, { useMemo, useState } from 'react';
import { classes } from '../../utils';
import { Button, CourseContainer } from '..';
import { OverlayCrnsContext } from '../../contexts';
import { useMobile } from '../../hooks';

const Comparison = () => {
  const mobile = useMobile();

  // Store the current set of CRNs that are shown on the Calendar overlay
  const [overlayCrns, setOverlayCrns] = useState([]);

  // Control second-level navigation between panes on mobile
  const [tabIndex, setTabIndex] = useState(0);

  // Memoize the CRN overlay set's context value so it is stable
  const overlayContextValue = useMemo(() => [overlayCrns, setOverlayCrns], [
    overlayCrns,
    setOverlayCrns
  ]);

  return (
    <>
      {mobile && (
        <div className="tab-container">
          {['Courses'].map((tabTitle, i) => (
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
          {(!mobile || tabIndex === 0) && <CourseContainer isExpandable={false} isCatalog={true} />}
        </div>
      </OverlayCrnsContext.Provider>
    </>
  );
};

export default Comparison;
