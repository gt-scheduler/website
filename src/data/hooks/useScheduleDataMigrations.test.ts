import Cookies from 'js-cookie';
import { renderHook } from '@testing-library/react-hooks';

import { asMockFunction, disableLogging } from '../../utils/tests';
import useScheduleDataMigrations from './useScheduleDataMigrations';
import { AnyScheduleData, LATEST_SCHEDULE_DATA_VERSION } from '../types';
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

  // Tests that the hook pulls data from cookies and applies migrations,
  // moving the return value from pending to done
  it('migrates data from cookies', () => {
    // The data in this case from cookies, so use the mocked cookiesGet
    asMockFunction(cookiesGet).mockReturnValue({
      '202108':
        '{"desiredCourses":["CS 1100","CS 1331"],"pinnedCrns":["87695","82294","88999","90769","89255","94424"],"excludedCrns":["95199"],"colorMap":{"CS 1100":"#0062B1","CS 1331":"#194D33"},"sortingOptionIndex":0}',
      term: '202108',
    });

    type HookProps = {
      rawScheduleData: AnyScheduleData | null;
    };
    const setScheduleDataMock = jest.fn();
    const { result, rerender } = renderHook<HookProps, unknown>(
      ({ rawScheduleData }) =>
        useScheduleDataMigrations({
          setScheduleData: setScheduleDataMock,
          rawScheduleData,
        }),
      {
        initialProps: {
          rawScheduleData: null,
        },
      }
    );

    const expectedScheduleData: AnyScheduleData = {
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
    };

    // The migrated data should have been passed to `setScheduleData`
    expect(setScheduleDataMock).toBeCalledTimes(1);
    expect(setScheduleDataMock).toBeCalledWith(expectedScheduleData);

    // Running the hook with the updated schedule data
    // (simulating the results of setting the state)
    // should result in it returning 'done'.
    rerender({ rawScheduleData: expectedScheduleData });
    expect(result.all).toEqual([
      {
        type: 'pending',
      },
      {
        type: 'done',
        result: expectedScheduleData,
      },
    ]);
  });

  // Tests that the hook skips migrations if not needed.
  // This test will need to be updated whenever adding migrations.
  it('skips migration if not needed', () => {
    const setScheduleDataMock = jest.fn();
    const { result } = renderHook(() =>
      useScheduleDataMigrations({
        setScheduleData: setScheduleDataMock,
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
      })
    );

    const expectedScheduleData = {
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
    };

    // The callback shouldn't have been invoked,
    // but the data returned should still be the latest version
    expect(setScheduleDataMock).toBeCalledTimes(0);
    expect(expectedScheduleData.version).toEqual(LATEST_SCHEDULE_DATA_VERSION);
    expect(result.all).toEqual([
      {
        type: 'done',
        result: expectedScheduleData,
      },
    ]);
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

    type HookProps = {
      rawScheduleData: AnyScheduleData | null;
    };
    const setScheduleDataMock = jest.fn();
    const { result } = renderHook<HookProps, unknown>(
      ({ rawScheduleData }) =>
        useScheduleDataMigrations({
          setScheduleData: setScheduleDataMock,
          rawScheduleData,
        }),
      {
        initialProps: {
          rawScheduleData: null,
        },
      }
    );

    expect(setScheduleDataMock).toBeCalledTimes(0);
    expect(result.all).toEqual([
      {
        type: 'pending',
      },
      expect.objectContaining({
        type: 'error',
        // The matcher returns `any`, so we have to suppress the lint here:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error: expect.objectContaining({
          type: 'error',
          stillLoading: false,
          // Other fields ignored
        }),
        // Other fields ignored
      }),
    ]);
  });
});
