import React, { useEffect, useState } from 'react';
import { render, getByTestId } from '@testing-library/react';
import Cookies from 'js-cookie';
import * as useLocalStorageState from 'use-local-storage-state';
import { Draft } from 'immer';
import fastSafeStringify from 'fast-safe-stringify';

import useScheduleDataFromStorage, {
  SCHEDULE_DATA_LOCAL_STORAGE_KEY,
} from './useScheduleDataFromStorage';
import {
  asMockFunction,
  disableLogging,
  useAllResults,
} from '../../utils/tests';
import * as migrations from '../migrations';
import { ScheduleData } from '../types';

// Mock the `Cookies` object so we can set values
jest.mock('js-cookie');
// eslint-disable-next-line jest/unbound-method
const cookiesGet = Cookies.get;

// This function allows for mocking the `use-local-storage-state` hook,
// which is used in tests to simulate specific behavior
// (such as `isPersistent` being false).
function mockUseLocalStorageState(
  fn: typeof useLocalStorageState['default']
): void {
  jest.spyOn(useLocalStorageState, 'default');
  jest.spyOn(useLocalStorageState, 'useLocalStorageState');
  asMockFunction(useLocalStorageState.default).mockImplementation(fn);
  asMockFunction(useLocalStorageState.useLocalStorageState).mockImplementation(
    fn
  );
}

describe('useScheduleDataFromStorage', () => {
  afterEach(() => {
    // Ensure we reset the local storage mock after each test
    window.localStorage.clear();
  });

  // This component just gets the result of the hook and exposes its result
  function TestComponent(): React.ReactElement {
    const result = useScheduleDataFromStorage();
    const allResults = useAllResults(result);
    return <div data-testid="result">{fastSafeStringify(allResults)}</div>;
  }

  // Tests that, with empty cookies and local storage,
  // the hook loads the default data correctly.
  // Update this test when updating data schemas.
  it('loads default data', () => {
    asMockFunction(cookiesGet).mockReturnValue({});

    const { container } = render(<TestComponent />);
    const resultDiv = getByTestId(container, 'result');
    const getResult = (): unknown => JSON.parse(resultDiv?.textContent ?? '');

    expect(getResult()).toEqual([
      {
        type: 'loading',
      },
      {
        type: 'loaded',
        result: {
          scheduleData: {
            currentTerm: '',
            terms: {},
            version: 1,
          },
        },
      },
    ]);

    expect(window.localStorage.length).toBe(1);
    expect(
      JSON.parse(
        window.localStorage.getItem(SCHEDULE_DATA_LOCAL_STORAGE_KEY) ?? ''
      )
    ).toEqual({
      currentTerm: '',
      terms: {},
      version: 1,
    });
  });

  // Tests that users that have data in the legacy cookies-based storage
  // have it get transferred into local storage.
  // Update this test when updating data schemas.
  it('loads data from legacy cookies', () => {
    asMockFunction(cookiesGet).mockReturnValue({
      '202108':
        '{"desiredCourses":["CS 1100","CS 1331"],"pinnedCrns":["87695","82294","88999","90769","89255","94424"],"excludedCrns":["95199"],"colorMap":{"CS 1100":"#0062B1","CS 1331":"#194D33"},"sortingOptionIndex":0}',
      term: '202108',
    });

    const { container } = render(<TestComponent />);
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
        type: 'loading',
      },
      {
        type: 'loaded',
        result: {
          scheduleData: expectedScheduleData,
        },
      },
    ]);

    expect(window.localStorage.length).toBe(1);
    expect(
      JSON.parse(
        window.localStorage.getItem(SCHEDULE_DATA_LOCAL_STORAGE_KEY) ?? ''
      )
    ).toEqual(expectedScheduleData);
  });

  // Tests that users that have data in local storage get it loaded correctly.
  // Update this test when updating data schemas.
  it('loads data from local storage', () => {
    asMockFunction(cookiesGet).mockReturnValue({});
    window.localStorage.setItem(
      SCHEDULE_DATA_LOCAL_STORAGE_KEY,
      '{"currentTerm":"202108","terms":{"202108":{"versions":{"Primary":{"desiredCourses":["CS 1100","CS 1331"],"pinnedCrns":["87695","82294","88999","90769","89255","94424"],"excludedCrns":["95199"],"colorMap":{"CS 1100":"#0062B1","CS 1331":"#194D33"},"sortingOptionIndex":0}},"currentVersion":"Primary"}},"version":1}'
    );

    const { container } = render(<TestComponent />);
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
        type: 'loaded',
        result: {
          scheduleData: expectedScheduleData,
        },
      },
    ]);
  });

  // Tests that users that have data in both local storage and in cookies
  // use the data from local storage.
  // Update this test when updating data schemas.
  it('uses local storage before cookies', () => {
    asMockFunction(cookiesGet).mockReturnValue({
      '200005':
        '{"desiredCourses":["CS 4510"],"pinnedCrns":[],"excludedCrns":[],"colorMap":{"CS 4510":"#194D33"},"sortingOptionIndex":0}',
      term: '200005',
    });
    window.localStorage.setItem(
      SCHEDULE_DATA_LOCAL_STORAGE_KEY,
      '{"currentTerm":"202108","terms":{"202108":{"versions":{"Primary":{"desiredCourses":["CS 1100"],"pinnedCrns":[],"excludedCrns":[],"colorMap":{"CS 1100":"#0062B1"},"sortingOptionIndex":0}},"currentVersion":"Primary"}},"version":1}'
    );

    const { container } = render(<TestComponent />);
    const resultDiv = getByTestId(container, 'result');
    const getResult = (): unknown => JSON.parse(resultDiv?.textContent ?? '');

    const expectedScheduleData = {
      currentTerm: '202108',
      terms: {
        // This would be `200005` if it was loaded from cookies
        '202108': {
          versions: {
            Primary: {
              desiredCourses: ['CS 1100'],
              pinnedCrns: [],
              excludedCrns: [],
              colorMap: { 'CS 1100': '#0062B1' },
              sortingOptionIndex: 0,
            },
          },
          currentVersion: 'Primary',
        },
      },
      version: 1,
    };

    // If actual migrations are performed (at some point in the future),
    // then this might need to have a 'loading' stage
    expect(getResult()).toEqual([
      {
        type: 'loaded',
        result: {
          scheduleData: expectedScheduleData,
        },
      },
    ]);
  });

  // Tests that if `useLocalStorageState` returns `false` for `isPersistent`,
  // the `useScheduleDataFromStorage` hook returns an error result.
  it('returns an error if the browser does not support persistence', () => {
    asMockFunction(cookiesGet).mockReturnValue({});

    mockUseLocalStorageState(() => [
      null,
      (): void => undefined,
      { isPersistent: false, removeItem: (): void => undefined },
    ]);

    const { container } = render(<TestComponent />);
    const resultDiv = getByTestId(container, 'result');
    const getResult = (): unknown => JSON.parse(resultDiv?.textContent ?? '');

    expect(getResult()).toEqual([
      expect.objectContaining({
        type: 'custom',
        // Other fields ignored
      }),
    ]);
  });

  // Tests that an error during migration causes the hook
  // to return an error result.
  it('returns an error if an error occurred during migration', () => {
    asMockFunction(cookiesGet).mockReturnValue({});

    // Override the default behavior of `migrateScheduleData`
    // to always throw an error
    jest.spyOn(migrations, 'default');
    asMockFunction(migrations.default).mockImplementation(() => {
      throw new Error('forced test error');
    });

    // Disable console.* commands for this test
    // since it purposefully causes errors
    disableLogging();

    const { container } = render(<TestComponent />);
    const resultDiv = getByTestId(container, 'result');
    const getResult = (): unknown => JSON.parse(resultDiv?.textContent ?? '');

    expect(getResult()).toEqual([
      {
        type: 'loading',
      },
      expect.objectContaining({
        type: 'error',
        stillLoading: false,
        // Other fields ignored
      }),
    ]);
  });

  describe('updateScheduleData', () => {
    type UpdateTestComponentProps = {
      applyUpdate: (draft: Draft<ScheduleData>) => void;
    };

    // This component performs a single update on the content
    function UpdateTestComponent({
      applyUpdate,
    }: UpdateTestComponentProps): React.ReactElement {
      const result = useScheduleDataFromStorage();
      const [madeUpdate, setMadeUpdate] = useState(false);

      useEffect(() => {
        if (result.type === 'loaded' && !madeUpdate) {
          result.result.updateScheduleData(applyUpdate);
          setMadeUpdate(true);
        }
      }, [madeUpdate, result, applyUpdate]);

      const allResults = useAllResults(result);
      return <div data-testid="result">{fastSafeStringify(allResults)}</div>;
    }

    // Tests that calling `updateScheduleData` causes a re-render
    // with the new state as expected.
    it('allows for modifying the schedule data', () => {
      asMockFunction(cookiesGet).mockReturnValue({});

      const { container } = render(
        <UpdateTestComponent
          applyUpdate={(draft): void => {
            draft.currentTerm = '201808';
            draft.terms['201808'] = {
              versions: {},
              currentVersion: '',
            };
          }}
        />
      );
      const resultDiv = getByTestId(container, 'result');
      const getResult = (): unknown => JSON.parse(resultDiv?.textContent ?? '');

      expect(getResult()).toEqual([
        {
          type: 'loading',
        },
        {
          type: 'loaded',
          result: {
            scheduleData: {
              currentTerm: '',
              terms: {},
              version: 1,
            },
          },
        },
        {
          type: 'loaded',
          result: {
            scheduleData: {
              currentTerm: '201808',
              terms: {
                '201808': {
                  versions: {},
                  currentVersion: '',
                },
              },
              version: 1,
            },
          },
        },
      ]);
    });

    // Tests that local storage contains the updated schedule data
    // after the update function is called.
    it('is persists updates to local storage', () => {
      asMockFunction(cookiesGet).mockReturnValue({});

      render(
        <UpdateTestComponent
          applyUpdate={(draft): void => {
            draft.currentTerm = '201808';
            draft.terms['201808'] = {
              versions: {},
              currentVersion: '',
            };
          }}
        />
      );

      expect(window.localStorage.length).toBe(1);
      expect(
        JSON.parse(
          window.localStorage.getItem(SCHEDULE_DATA_LOCAL_STORAGE_KEY) ?? ''
        )
      ).toEqual({
        currentTerm: '201808',
        terms: {
          '201808': {
            versions: {},
            currentVersion: '',
          },
        },
        version: 1,
      });
    });
  });
});
