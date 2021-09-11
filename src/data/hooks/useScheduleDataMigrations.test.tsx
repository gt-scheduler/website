import React, { useCallback, useState } from 'react';
import { render, getByTestId } from '@testing-library/react';
import Cookies from 'js-cookie';

import {
  asMockFunction,
  disableLogging,
  useAllResults,
} from '../../utils/tests';
import useScheduleDataMigrations from './useScheduleDataMigrations';
import {
  AnyScheduleData,
  LATEST_SCHEDULE_DATA_VERSION,
  ScheduleData,
} from '../types';
import * as migrations from '../migrations';

// Mock the `Cookies` object so we can set values
jest.mock('js-cookie');
// eslint-disable-next-line jest/unbound-method
const cookiesGet = Cookies.get;

describe('useScheduleDataMigrations', () => {
  afterEach(() => {
    // Ensure we reset the local storage mock after each test
    window.localStorage.clear();
  });

  type TestComponentProps = {
    initialScheduleData: AnyScheduleData | null;
    onSetScheduleData: (next: ScheduleData) => void;
    isPersistent: boolean;
  };

  // This component stores the schedule data state,
  // and gets the result of the hook to expose its result
  function TestComponent({
    initialScheduleData,
    onSetScheduleData,
    isPersistent,
  }: TestComponentProps): React.ReactElement {
    const [scheduleData, setScheduleDataState] = useState(initialScheduleData);
    const setScheduleData = useCallback(
      (next: ScheduleData) => {
        setScheduleDataState(next);
        onSetScheduleData(next);
      },
      [onSetScheduleData]
    );
    const result = useScheduleDataMigrations({
      rawScheduleData: scheduleData,
      setScheduleData,
      isPersistent,
    });
    const allResults = useAllResults(result);
    return <div data-testid="result">{JSON.stringify(allResults)}</div>;
  }

  // Tests that the hook pulls data from cookies and applies migrations,
  // moving the return value from pending to done
  it('migrates data from cookies', () => {
    // The data in this case from cookies, so use the mocked cookiesGet
    asMockFunction(cookiesGet).mockReturnValue({
      '202108':
        '{"desiredCourses":["CS 1100","CS 1331"],"pinnedCrns":["87695","82294","88999","90769","89255","94424"],"excludedCrns":["95199"],"colorMap":{"CS 1100":"#0062B1","CS 1331":"#194D33"},"sortingOptionIndex":0}',
      term: '202108',
    });

    const setScheduleDataMock = jest.fn();
    const { container } = render(
      <TestComponent
        initialScheduleData={null}
        onSetScheduleData={setScheduleDataMock}
        isPersistent
      />
    );
    const resultDiv = getByTestId(container, 'result');
    const getResult = (): unknown => JSON.parse(resultDiv?.textContent ?? '');

    const expectedScheduleData = {
      currentTerm: '202108',
      terms: {
        '202108': {
          versions: {
            Primary: {
              desiredCourses: ['CS 1100', 'CS 1331'],
              pinnedCrns: [
                '87695',
                '82294',
                '88999',
                '90769',
                '89255',
                '94424',
              ],
              excludedCrns: ['95199'],
              colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
              sortingOptionIndex: 0,
            },
          },
          currentVersion: 'Primary',
        },
      },
      version: 1,
    };

    expect(getResult()).toEqual([
      {
        type: 'pending',
      },
      {
        type: 'done',
        result: expectedScheduleData,
      },
    ]);

    expect(setScheduleDataMock).toBeCalledTimes(1);
    expect(setScheduleDataMock).toBeCalledWith(expectedScheduleData);
  });

  // Tests that the hook applies migrations as expected,
  // moving the return value from pending to done
  it('migrates data given initial data', () => {
    const setScheduleDataMock = jest.fn();
    const { container } = render(
      <TestComponent
        initialScheduleData={{
          currentTerm: '202108',
          terms: {
            '202108': {
              versions: {
                Primary: {
                  desiredCourses: ['CS 1100', 'CS 1331'],
                  pinnedCrns: [
                    '87695',
                    '82294',
                    '88999',
                    '90769',
                    '89255',
                    '94424',
                  ],
                  excludedCrns: ['95199'],
                  colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
                  sortingOptionIndex: 0,
                },
              },
              currentVersion: 'Primary',
            },
          },
          version: 1,
        }}
        onSetScheduleData={setScheduleDataMock}
        isPersistent
      />
    );
    const resultDiv = getByTestId(container, 'result');
    const getResult = (): unknown => JSON.parse(resultDiv?.textContent ?? '');

    const expectedScheduleData = {
      currentTerm: '202108',
      terms: {
        '202108': {
          versions: {
            Primary: {
              desiredCourses: ['CS 1100', 'CS 1331'],
              pinnedCrns: [
                '87695',
                '82294',
                '88999',
                '90769',
                '89255',
                '94424',
              ],
              excludedCrns: ['95199'],
              colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
              sortingOptionIndex: 0,
            },
          },
          currentVersion: 'Primary',
        },
      },
      version: 1,
    };

    expect(expectedScheduleData.version).toEqual(LATEST_SCHEDULE_DATA_VERSION);
    expect(getResult()).toEqual([
      {
        type: 'pending',
      },
      {
        type: 'done',
        result: expectedScheduleData,
      },
    ]);

    expect(setScheduleDataMock).toBeCalledTimes(1);
    expect(setScheduleDataMock).toBeCalledWith(expectedScheduleData);
  });

  // Tests that not having persistent local storage in the browser
  // causes migrations not to occur, and have the hook always return pending
  it("does not migrate if storage isn't persistent", () => {
    const setScheduleDataMock = jest.fn();
    const { container } = render(
      <TestComponent
        initialScheduleData={null}
        onSetScheduleData={setScheduleDataMock}
        isPersistent={false}
      />
    );
    const resultDiv = getByTestId(container, 'result');
    const getResult = (): unknown => JSON.parse(resultDiv?.textContent ?? '');

    expect(getResult()).toEqual([
      {
        type: 'pending',
      },
    ]);

    expect(setScheduleDataMock).toBeCalledTimes(0);
  });

  // Tests that an error during migration causes an error return value
  it('returns an error if one occurred during migration', () => {
    // Override the default behavior of `migrateScheduleData`
    // to always throw an error
    jest.spyOn(migrations, 'default');
    asMockFunction(migrations.default).mockImplementation(() => {
      throw new Error('forced test error');
    });

    // Disable console.* commands for this test
    // since it purposefully causes errors
    disableLogging();

    const setScheduleDataMock = jest.fn();
    const { container } = render(
      <TestComponent
        initialScheduleData={null}
        onSetScheduleData={setScheduleDataMock}
        isPersistent
      />
    );
    const resultDiv = getByTestId(container, 'result');
    const getResult = (): unknown => JSON.parse(resultDiv?.textContent ?? '');

    expect(getResult()).toEqual([
      {
        type: 'pending',
      },
      expect.objectContaining({
        type: 'error',
        // Other fields ignored
      }),
    ]);

    expect(setScheduleDataMock).toBeCalledTimes(0);
  });
});
