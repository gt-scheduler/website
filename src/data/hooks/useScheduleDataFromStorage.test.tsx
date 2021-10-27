import React from 'react';
import { render, fireEvent, getByText } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import * as useLocalStorageState from 'use-local-storage-state';
import { act } from 'react-dom/test-utils';

import useScheduleDataFromStorage, {
  SCHEDULE_DATA_LOCAL_STORAGE_KEY,
} from './useScheduleDataFromStorage';
import { asMockFunction } from '../../utils/tests';
import LoadingDisplay from '../../components/LoadingDisplay';

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

describe('useRawScheduleDataFromStorage', () => {
  afterEach(() => {
    // Ensure we reset the local storage after each test
    window.localStorage.clear();
  });

  // Tests that, with empty local storage,
  // the hook loads the default data (null) correctly.
  it('loads default data', () => {
    const { result } = renderHook(() => useScheduleDataFromStorage());
    expect(result.all).toEqual([
      {
        type: 'loaded',
        result: {
          setRawScheduleData: expect.any(Function) as unknown,
          rawScheduleData: null,
        },
      },
    ]);
  });

  // Tests that users that have data in local storage get it loaded correctly.
  // Update this test when updating data schemas.
  it('loads data from local storage', () => {
    window.localStorage.setItem(
      SCHEDULE_DATA_LOCAL_STORAGE_KEY,
      JSON.stringify({
        currentTerm: '202108',
        terms: {
          '202108': {
            versions: [
              {
                name: 'Primary',
                schedule: {
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
            ],
            currentIndex: 0,
          },
        },
        version: 1,
      })
    );

    const { result } = renderHook(() => useScheduleDataFromStorage());
    expect(result.all).toEqual([
      {
        type: 'loaded',
        result: {
          setRawScheduleData: expect.any(Function) as unknown,
          rawScheduleData: {
            currentTerm: '202108',
            terms: {
              '202108': {
                versions: [
                  {
                    name: 'Primary',
                    schedule: {
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
                ],
                currentIndex: 0,
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

    // Note: if you get an error here (or in the next test) about
    // '"messageParent" can only be used inside a worker',
    // it's because Jest is terrible and giving a completely unrelated error.
    // It's much more likely that its JSON serializer is failing
    // due to the circular JSON in React JSX elements,
    // which means that the expect.toEqual call is failing.
    // Using console.log and manually fixing it is recommended.
    // See https://github.com/facebook/jest/issues/10577
    const { result } = renderHook(() => useScheduleDataFromStorage());
    expect(result.all).toEqual([
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
      {
        type: 'loaded',
        result: {
          setRawScheduleData: expect.any(Function) as unknown,
          rawScheduleData: null,
        },
      },
    ]);
  });

  describe('setRawScheduleData', () => {
    // Tests that calling `setRawScheduleData` causes a re-render
    // with the new state as expected.
    it('allows for modifying the schedule data', () => {
      const { result } = renderHook(() => useScheduleDataFromStorage());
      expect(result.all).toEqual([
        {
          type: 'loaded',
          result: {
            setRawScheduleData: expect.any(Function) as unknown,
            rawScheduleData: null,
          },
        },
      ]);

      // Update the schedule data explicitly
      const { current } = result;
      if (current.type !== 'loaded') fail("result hasn't yet loaded");
      act(() => {
        current.result.setRawScheduleData({
          currentTerm: '201808',
          terms: {
            '201808': {
              versions: [],
              currentIndex: 0,
            },
          },
          version: 1,
        });
      });

      expect(result.all).toEqual([
        {
          type: 'loaded',
          result: {
            setRawScheduleData: expect.any(Function) as unknown,
            rawScheduleData: null,
          },
        },
        {
          type: 'loaded',
          result: {
            setRawScheduleData: expect.any(Function) as unknown,
            rawScheduleData: {
              currentTerm: '201808',
              terms: {
                '201808': {
                  versions: [],
                  currentIndex: 0,
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
        current.result.setRawScheduleData({
          currentTerm: '201808',
          terms: {
            '201808': {
              versions: [],
              currentIndex: 0,
            },
          },
          version: 1,
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
            versions: [],
            currentIndex: 0,
          },
        },
        version: 1,
      });
    });
  });
});
