import React, { useCallback, useContext, useMemo } from 'react';
import { AutoSizer, List } from 'react-virtualized';

import { Button, Calendar, Select } from '..';
import { OverlayCrnsContext, ScheduleContext } from '../../contexts';
import { Combination } from '../../types';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function CombinationContainer(): React.ReactElement {
  const [
    { oscar, desiredCourses, pinnedCrns, excludedCrns, sortingOptionIndex },
    { patchSchedule },
  ] = useContext(ScheduleContext);
  const [, setOverlayCrns] = useContext(OverlayCrnsContext);

  const handleResetPinnedCrns = useCallback(() => {
    if (window.confirm('Are you sure to reset sections you selected?')) {
      patchSchedule({
        pinnedCrns: [],
      });
    }
  }, [patchSchedule]);

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
        onChange={(newSortingOptionIndex): void =>
          patchSchedule({ sortingOptionIndex: newSortingOptionIndex })
        }
        current={sortingOptionIndex}
        options={oscar.sortingOptions.map((sortingOption, i) => ({
          id: i,
          label: sortingOption.label,
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
          {({ width, height }): React.ReactElement => (
            <List
              width={width}
              height={height}
              style={{ outline: 'none' }}
              rowCount={sortedCombinations.length}
              rowHeight={108}
              rowRenderer={({ index, key, style }): React.ReactElement => {
                const { crns } = sortedCombinations[index] as Combination;
                return (
                  <div className="list-item" style={style} key={key}>
                    <div
                      className="combination"
                      onMouseEnter={(): void => setOverlayCrns(crns)}
                      onMouseLeave={(): void => setOverlayCrns([])}
                      onClick={(): void =>
                        patchSchedule({
                          pinnedCrns: [...pinnedCrns, ...crns],
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
