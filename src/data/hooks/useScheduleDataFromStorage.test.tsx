import React from 'react';
import { render, fireEvent, getByText } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import Cookies from 'js-cookie';
import * as useLocalStorageState from 'use-local-storage-state';
import { act } from 'react-dom/test-utils';

import useScheduleDataFromStorage, {
  SCHEDULE_DATA_LOCAL_STORAGE_KEY,
} from './useScheduleDataFromStorage';
import { asMockFunction, disableLogging } from '../../utils/tests';
import * as migrations from '../migrations';
import LoadingDisplay from '../../components/LoadingDisplay';

// Mock the `Cookies` object so we can set values
jest.mock('js-cookie');
// eslint-disable-next-line jest/unbound-method
const cookiesGet = Cookies.get;

// This function allows for mocking the `use-local-storage-state` hook,
// which is used in tests to simulate specific behavior
// (such as `isPersistent` being false).
type UseLocalStorageState = typeof useLocalStorageState['default'];
function mockUseLocalStorageState(
  replace?: (original: UseLocalStorageState) => UseLocalStorageState
): void {
  const original = jest.requireActual<typeof useLocalStorageState>(
    'use-local-storage-state'
  );
  const replacement =
    replace !== undefined ? replace(original.default) : original.default;

  jest.spyOn(useLocalStorageState, 'default');
  jest.spyOn(useLocalStorageState, 'useLocalStorageState');
  asMockFunction(useLocalStorageState.default).mockImplementation(replacement);
  asMockFunction(useLocalStorageState.useLocalStorageState).mockImplementation(
    replacement
  );
}

describe('useScheduleDataFromStorage', () => {
  beforeEach(() => {
    // By default, mock the cookies as being empty
    asMockFunction(cookiesGet).mockReturnValue({});
  });

  afterEach(() => {
    // Ensure we reset the local storage mock after each test
    window.localStorage.clear();
  });

  // Tests that, with empty cookies and local storage,
  // the hook loads the default data correctly.
  // Update this test when updating data schemas.
  it('loads default data', () => {
    const { result } = renderHook(() => useScheduleDataFromStorage());
    expect(result.all).toEqual([
      {
        type: 'loading',
      },
      {
        type: 'loaded',
        result: {
          updateScheduleData: expect.any(Function) as unknown,
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

    const { result } = renderHook(() => useScheduleDataFromStorage());
    expect(result.all).toEqual([
      {
        type: 'loading',
      },
      {
        type: 'loaded',
        result: {
          updateScheduleData: expect.any(Function) as unknown,
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
    window.localStorage.setItem(
      SCHEDULE_DATA_LOCAL_STORAGE_KEY,
      '{"currentTerm":"202108","terms":{"202108":{"versions":{"Primary":{"desiredCourses":["CS 1100","CS 1331"],"pinnedCrns":["87695","82294","88999","90769","89255","94424"],"excludedCrns":["95199"],"colorMap":{"CS 1100":"#0062B1","CS 1331":"#194D33"},"sortingOptionIndex":0}},"currentVersion":"Primary"}},"version":1}'
    );

    const { result } = renderHook(() => useScheduleDataFromStorage());
    expect(result.all).toEqual([
      {
        type: 'loaded',
        result: {
          updateScheduleData: expect.any(Function) as unknown,
          scheduleData: {
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
          },
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

    const { result } = renderHook(() => useScheduleDataFromStorage());
    // If actual migrations are performed (at some point in the future),
    // then this might need to have a 'loading' stage
    expect(result.all).toEqual([
      {
        type: 'loaded',
        result: {
          updateScheduleData: expect.any(Function) as unknown,
          scheduleData: {
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
          },
        },
      },
    ]);
  });

  // Tests that if `useLocalStorageState` returns `false` for `isPersistent`,
  // the `useScheduleDataFromStorage` hook returns an error result.
  it('returns an error if the browser does not support persistence', () => {
    mockUseLocalStorageState(
      (original) =>
        ((...args) => {
          const [value, setValue, other] = original(...args);
          return [value, setValue, { ...other, isPersistent: false }];
        }) as UseLocalStorageState
    );

    const { result } = renderHook(() => useScheduleDataFromStorage());
    expect(result.all).toEqual([
      expect.objectContaining({
        type: 'custom',
        // Other fields ignored
      }),
      expect.objectContaining({
        type: 'custom',
        // Other fields ignored
      }),
    ]);
  });

  // Tests that if `useLocalStorageState` returns `false` for `isPersistent`,
  // the "Accept" button can still be used to continue using the app.
  it('allows the user to continue even if the browser does not support persistence', () => {
    mockUseLocalStorageState(
      (original) =>
        ((...args) => {
          const [value, setValue, other] = original(...args);
          return [value, setValue, { ...other, isPersistent: false }];
        }) as UseLocalStorageState
    );

    const { result } = renderHook(() => useScheduleDataFromStorage());
    expect(result.all).toEqual([
      expect.objectContaining({
        type: 'custom',
        // Other fields ignored
      }),
      expect.objectContaining({
        type: 'custom',
        // Other fields ignored
      }),
    ]);

    const { current } = result;
    if (current.type === 'loaded')
      fail('result was loaded before user accepted');

    // Render the loading state and press the accept button
    const { container } = render(<LoadingDisplay state={current} name="" />);
    fireEvent(
      getByText(container, 'Accept'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
    );

    expect(result.all).toEqual([
      expect.objectContaining({
        type: 'custom',
        // Other fields ignored
      }),
      expect.objectContaining({
        type: 'custom',
        // Other fields ignored
      }),
      {
        type: 'loaded',
        result: {
          updateScheduleData: expect.any(Function) as unknown,
          scheduleData: {
            currentTerm: '',
            terms: {},
            version: 1,
          },
        },
      },
    ]);
  });

  // Tests that an error during migration causes the hook
  // to return an error result.
  it('returns an error if an error occurred during migration', () => {
    // Override the default behavior of `migrateScheduleData`
    // to always throw an error
    jest.spyOn(migrations, 'default');
    asMockFunction(migrations.default).mockImplementation(() => {
      throw new Error('forced test error');
    });

    // Disable console.* commands for this test
    // since it purposefully causes errors
    disableLogging();

    const { result } = renderHook(() => useScheduleDataFromStorage());
    expect(result.all).toEqual([
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
    // Tests that calling `updateScheduleData` causes a re-render
    // with the new state as expected.
    it('allows for modifying the schedule data', () => {
      const { result } = renderHook(() => useScheduleDataFromStorage());
      expect(result.all).toEqual([
        {
          type: 'loading',
        },
        {
          type: 'loaded',
          result: {
            updateScheduleData: expect.any(Function) as unknown,
            scheduleData: {
              currentTerm: '',
              terms: {},
              version: 1,
            },
          },
        },
      ]);

      // Update the schedule data explicitly
      const { current } = result;
      if (current.type !== 'loaded') fail("result hasn't yet loaded");
      act(() => {
        current.result.updateScheduleData((draft): void => {
          draft.currentTerm = '201808';
          draft.terms['201808'] = {
            versions: {},
            currentVersion: '',
          };
        });
      });

      expect(result.all).toEqual([
        {
          type: 'loading',
        },
        {
          type: 'loaded',
          result: {
            updateScheduleData: expect.any(Function) as unknown,
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
            updateScheduleData: expect.any(Function) as unknown,
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
      const { result } = renderHook(() => useScheduleDataFromStorage());

      // Update the schedule data explicitly
      const { current } = result;
      if (current.type !== 'loaded') fail("result hasn't yet loaded");
      act(() => {
        current.result.updateScheduleData((draft): void => {
          draft.currentTerm = '201808';
          draft.terms['201808'] = {
            versions: {},
            currentVersion: '',
          };
        });
      });

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
