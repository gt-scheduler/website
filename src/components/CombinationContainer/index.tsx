import React, { useCallback, useContext, useMemo } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import { Button, Calendar, Select } from '..';
import 'react-virtualized/styles.css';
import './stylesheet.scss';
import { OverlayCrnsContext, TermContext } from '../../contexts';

export default function CombinationContainer(): React.ReactElement {
  const [
    { oscar, desiredCourses, pinnedCrns, excludedCrns, sortingOptionIndex },
    { patchTermData }
  ] = useContext(TermContext);
  const [, setOverlayCrns] = useContext(OverlayCrnsContext);

  const handleResetPinnedCrns = useCallback(() => {
    if (window.confirm('Are you sure to reset sections you selected?')) {
      patchTermData({
        pinnedCrns: []
      });
    }
  }, [patchTermData]);

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
        // eslint-disable-next-line no-shadow
        onChange={(sortingOptionIndex) => patchTermData({ sortingOptionIndex })}
        value={sortingOptionIndex}
        options={oscar.sortingOptions.map((sortingOption, i) => ({
          value: i,
          label: sortingOption.label
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
                        patchTermData({
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
