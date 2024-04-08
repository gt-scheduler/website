import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  AutoSizer as _AutoSizer,
  AutoSizerProps,
  List as _List,
  ListProps,
} from 'react-virtualized';

import { Button, Calendar, Select } from '..';
import { OverlayCrnsContext, ScheduleContext } from '../../contexts';
import { Combination } from '../../types';
import Modal from '../Modal';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

// Workaround for problem with `react-virtualized` types resolving to wrong
// version of @types/react:
// From https://github.com/bvaughn/react-virtualized/issues/1739#issuecomment-1264276522
const List = _List as unknown as React.ComponentType<ListProps>;
const AutoSizer = _AutoSizer as unknown as React.ComponentType<AutoSizerProps>;

export type ComparisonPanelProps = {
  compare?: boolean;
};

export default function CombinationContainer({
  compare = false,
}: ComparisonPanelProps): React.ReactElement {
  const [
    {
      oscar,
      desiredCourses,
      pinnedCrns,
      excludedCrns,
      events,
      sortingOptionIndex,
    },
    { patchSchedule },
  ] = useContext(ScheduleContext);
  const [, setOverlayCrns] = useContext(OverlayCrnsContext);

  const [confirmReset, setConfirmReset] = useState(false);
  const handleResetPinnedCrns = useCallback(() => {
    setConfirmReset(true);
  }, []);

  const combinations = useMemo(
    () =>
      oscar.getCombinations(desiredCourses, pinnedCrns, excludedCrns, events),
    [oscar, desiredCourses, pinnedCrns, excludedCrns, events]
  );
  const sortedCombinations = useMemo(
    () => oscar.sortCombinations(combinations, sortingOptionIndex, events),
    [oscar, combinations, sortingOptionIndex, events]
  );

  return (
    <>
      <div className="CombinationContainer">
        {compare ? (
          <div className="turn-off-compare-text">
            Turn compare schedules off to view section combinations!
          </div>
        ) : (
          <>
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
                    /*
                    List.rowRenderer is a normal render prop,
                    not a component.
                    */
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line react/no-unstable-nested-components
                    rowRenderer={({
                      index,
                      key,
                      style,
                    }): React.ReactElement => {
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
                              compare={compare}
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
          </>
        )}
      </div>

      <Modal
        show={confirmReset}
        onHide={(): void => setConfirmReset(false)}
        buttons={[
          {
            label: 'Cancel',
            cancel: true,
            onClick: (): void => setConfirmReset(false),
          },
          {
            label: 'Reset',
            onClick: (): void => {
              setConfirmReset(false);
              patchSchedule({
                pinnedCrns: [],
              });
            },
          },
        ]}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>Reset confirmation</h2>
          <p>Are you sure you want to reset selected sections?</p>
        </div>
      </Modal>
    </>
  );
}
