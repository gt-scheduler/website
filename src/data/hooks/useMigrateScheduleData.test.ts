import Cookies from 'js-cookie';
import { renderHook, waitFor } from '@testing-library/react';

import { asMockFunction, disableLogging } from '../../utils/tests';
import useMigrateScheduleData from './useMigrateScheduleData';
import {
  AnyScheduleData,
  LATEST_SCHEDULE_DATA_VERSION,
  ScheduleData,
} from '../types';
import * as dataTypes from '../types';
import * as migrations from '../migrations';

// Mock the `Cookies` object so we can set values
jest.mock('js-cookie');
// eslint-disable-next-line jest/unbound-method
const cookiesGet = Cookies.get;

describe('useMigrateScheduleData', () => {
  beforeEach(() => {
    // Mock the current time to January 1, 1970
    jest.useFakeTimers().setSystemTime(new Date('1970-01-01').getTime());

    // Mock the ID generation to be deterministic
    let current_id = 0;
    jest.spyOn(dataTypes, 'generateScheduleVersionId');
    asMockFunction(dataTypes.generateScheduleVersionId).mockImplementation(
      () => {
        const id = `sv_${String(current_id).padStart(20, '0')}`;
        current_id += 1;
        return id;
      }
    );
  });

  afterEach(() => {
    // Ensure we reset the local storage after each test
    window.localStorage.clear();
  });

  // Tests that the hook pulls data from cookies and applies migrations,
  // moving the return value from loading to loaded
  it('migrates data from cookies', async () => {
    // The data in this case from cookies, so use the mocked cookiesGet
    asMockFunction(cookiesGet).mockReturnValue({
      '202108': JSON.stringify({
        desiredCourses: ['CS 1100', 'CS 1331'],
        pinnedCrns: ['87695', '82294', '88999', '90769', '89255', '94424'],
        excludedCrns: ['95199'],
        colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
        sortingOptionIndex: 0,
      }),
      term: '202108',
    });

    type HookProps = {
      rawScheduleData: AnyScheduleData | null;
    };
    const setRawScheduleDataMock = jest.fn();
    const { result, rerender } = renderHook(
      ({ rawScheduleData }: HookProps) =>
        useMigrateScheduleData({
          setRawScheduleData: setRawScheduleDataMock,
          rawScheduleData,
        }),
      {
        initialProps: {
          rawScheduleData: null,
        } as HookProps,
      }
    );

    await waitFor(() => expect(result.current.type).toEqual('loading'));
    expect(result.current).toEqual({
      type: 'loading',
    });

    const expectedScheduleData: ScheduleData = {
      terms: {
        '202108': {
          versions: {
            sv_00000000000000000000: {
              name: 'Primary',
              // January 1, 1970 at 0 seconds
              createdAt: '1970-01-01T00:00:00.000Z',
              friends: {},
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
                events: [],
                colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
                sortingOptionIndex: 0,
              },
            },
          },
        },
      },
      version: 3,
    };

    // The migrated data should have been passed to `setRawScheduleData`
    // when the effect runs.
    await waitFor(() => {
      expect(setRawScheduleDataMock).toBeCalledTimes(1);
      expect(setRawScheduleDataMock).toBeCalledWith(expectedScheduleData);
    });

    // Running the hook with the updated schedule data
    // (simulating the results of setting the state)
    // should result in it returning 'done'.
    rerender({ rawScheduleData: expectedScheduleData });
    await waitFor(() => expect(result.current.type).toEqual('loaded'));
    expect(result.current).toEqual({
      type: 'loaded',
      result: {
        scheduleData: expectedScheduleData,
        setScheduleData: expect.any(Function) as unknown,
      },
    });
  });

  // Tests that the hook skips migrations if not needed.
  // This test will need to be updated whenever adding migrations.
  it('skips migration if not needed', async () => {
    const setRawScheduleDataMock = jest.fn();
    const { result } = renderHook(() =>
      useMigrateScheduleData({
        setRawScheduleData: setRawScheduleDataMock,
        rawScheduleData: {
          terms: {
            '202108': {
              versions: {
                sv_48RC7kqO7YDiBK66qXOd: {
                  name: 'Primary',
                  createdAt: '2021-09-16T00:00:46.191Z',
                  friends: {},
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
                    events: [],
                    colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
                    sortingOptionIndex: 0,
                  },
                },
              },
            },
          },
          version: 3,
        },
      })
    );

    const expectedScheduleData = {
      terms: {
        '202108': {
          versions: {
            sv_48RC7kqO7YDiBK66qXOd: {
              name: 'Primary',
              createdAt: '2021-09-16T00:00:46.191Z',
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
                events: [],
                colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
                sortingOptionIndex: 0,
              },
              friends: {},
            },
          },
        },
      },
      version: 3,
    };

    // The callback shouldn't have been invoked,
    // but the data returned should still be the latest version
    await waitFor(() => expect(result.current.type).toEqual('loaded'));
    expect(setRawScheduleDataMock).toBeCalledTimes(0);
    expect(expectedScheduleData.version).toEqual(LATEST_SCHEDULE_DATA_VERSION);
    expect(result.current).toEqual({
      type: 'loaded',
      result: {
        scheduleData: expectedScheduleData,
        setScheduleData: expect.any(Function) as unknown,
      },
    });
  });

  // Tests that an error during migration causes an error return value
  it('returns an error if one occurred during migration', async () => {
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
    const setRawScheduleDataMock = jest.fn();
    const { result } = renderHook(
      ({ rawScheduleData }: HookProps) =>
        useMigrateScheduleData({
          setRawScheduleData: setRawScheduleDataMock,
          rawScheduleData,
        }),
      {
        initialProps: {
          rawScheduleData: null,
        } as HookProps,
      }
    );

    await waitFor(() => expect(result.current.type).toEqual('error'));
    expect(setRawScheduleDataMock).toBeCalledTimes(0);
    expect(result.current).toEqual(
      expect.objectContaining({
        type: 'error',
        stillLoading: false,
        // Other fields ignored
      })
    );
  });
});
