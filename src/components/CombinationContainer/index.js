import React, { useCallback, useContext, useMemo } from 'react';
import { AutoSizer, List } from 'react-virtualized/dist/commonjs';
import { Button, Calendar, Select } from '..';
import 'react-virtualized/styles.css';
import './stylesheet.scss';
import { OverlayCrnsContext, ScheduleContext } from '../../contexts';

export default function CombinationContainer() {
  const [
    { oscar, desiredCourses, pinnedCrns, excludedCrns, sortingOptionIndex },
    { patchScheduleData }
  ] = useContext(ScheduleContext);
  const [, setOverlayCrns] = useContext(OverlayCrnsContext);

  const handleResetPinnedCrns = useCallback(() => {
    if (window.confirm('Are you sure to reset sections you selected?')) {
      patchScheduleData({
        pinnedCrns: []
      });
    }
  }, [patchScheduleData]);

  const combinations = useMemo(
    () => oscar.getCombinations(desiredCourses, pinnedCrns, excludedCrns),
    [oscar, desiredCourses, pinnedCrns, excludedCrns]
  );
  const sortedCombinations = useMemo(
    () => oscar.sortCombinations(combinations, sortingOptionIndex),
    [oscar, combinations, sortingOptionIndex]
  );

  return (
    <div className="CombinationContainer">
      <Select
        value={sortingOptionIndex}
        options={oscar.sortingOptions.map((sortingOption, i) => ({
          optionId: i,
          optionLabel: sortingOption.label,
          // eslint-disable-next-line no-shadow
          onClick: (sortingOptionIndex) =>
            patchScheduleData({ sortingOptionIndex })
        }))}
      />
      <Button
        className="reset"
        onClick={handleResetPinnedCrns}
        disabled={pinnedCrns.length === 0}
      >
        Reset Sections
      </Button>
      <div className="scroller">
        <AutoSizer>
          {({ width, height }) => (
            <List
              width={width}
              height={height}
              style={{ outline: 'none' }}
              rowCount={sortedCombinations.length}
              rowHeight={108}
              rowRenderer={({ index, key, style }) => {
                const { crns } = sortedCombinations[index];
                return (
                  <div className="list-item" style={style} key={key}>
                    <div
                      className="combination"
                      onMouseEnter={() => setOverlayCrns(crns)}
                      onMouseLeave={() => setOverlayCrns([])}
                      onClick={() =>
                        patchScheduleData({
                          pinnedCrns: [...pinnedCrns, ...crns]
                        })
                      }
                    >
                      <div className="number">{index + 1}</div>
                      <Calendar
                        className="calendar-preview"
                        overlayCrns={crns}
                        isAutosized
                        preview
                      />
                    </div>
                  </div>
                );
              }}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
