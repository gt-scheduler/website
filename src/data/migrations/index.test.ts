import Cookies from 'js-cookie';

import migrateScheduleData from '.';
import { asMockFunction } from '../../utils/tests';
import * as dataTypes from '../types';

// Mock the `Cookies` object so we can set values
jest.mock('js-cookie');
// eslint-disable-next-line jest/unbound-method
const cookiesGet = Cookies.get;

// Note: the expected output of these tests should be updated
// whenever adding new migrations (to reflective the cumulative effect
// of applying all migrations after the one we're testing).
// This is fine: individual migrations should be tested elsewhere.
describe('migrateScheduleData', () => {
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

  // Tests the "migration" from version 0 (null/data in cookies) to version 1
  it('migrates data given schedule version 0 (null)', () => {
    // The data in this case from cookies, so use the mocked cookiesGet
    asMockFunction(cookiesGet).mockReturnValue({
      '202108':
        '{"desiredCourses":["CS 1100","CS 1331"],"pinnedCrns":["87695","82294","88999","90769","89255","94424"],"excludedCrns":["95199"],"colorMap":{"CS 1100":"#0062B1","CS 1331":"#194D33"},"sortingOptionIndex":0}',
      term: '202108',
    });

    expect(migrateScheduleData(null)).toEqual({
      terms: {
        '202108': {
          versions: {
            sv_00000000000000000000: {
              name: 'Primary',
              // January 1, 1970 at 0 seconds
              createdAt: '1970-01-01T00:00:00.000Z',
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
    });
  });

  it('migrates data given schedule version 1', () => {
    expect(
      migrateScheduleData({
        terms: {
          '202105': {
            versions: [
              {
                name: 'Primary',
                schedule: {
                  desiredCourses: [],
                  pinnedCrns: [],
                  excludedCrns: [],
                  colorMap: {},
                  sortingOptionIndex: 0,
                },
              },
            ],
            currentIndex: 0,
          },
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
        currentTerm: '202108',
        version: 1,
      })
    ).toEqual({
      terms: {
        '202105': {
          versions: {
            sv_00000000000000000000: {
              name: 'Primary',
              // January 1, 1970 at 0 seconds
              createdAt: '1970-01-01T00:00:00.000Z',
              schedule: {
                desiredCourses: [],
                pinnedCrns: [],
                excludedCrns: [],
                events: [],
                colorMap: {},
                sortingOptionIndex: 0,
              },
              friends: {},
            },
          },
        },
        '202108': {
          versions: {
            sv_00000000000000000001: {
              name: 'Primary',
              // January 1, 1970 at 0 seconds
              createdAt: '1970-01-01T00:00:00.000Z',
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
    });
  });

  it('migrates data given schedule version 2', () => {
    expect(
      migrateScheduleData({
        terms: {
          '202105': {
            versions: {
              sv_48RC7kqO7YDiBK66qXOd: {
                name: 'Primary',
                createdAt: '2021-09-15T23:57:40.270Z',
                schedule: {
                  desiredCourses: [],
                  pinnedCrns: [],
                  excludedCrns: [],
                  colorMap: {},
                  sortingOptionIndex: 0,
                },
              },
            },
          },
          '202108': {
            versions: {
              sv_ZUK7Uca9vvBhUn2lcXWb: {
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
                  colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
                  sortingOptionIndex: 0,
                },
              },
            },
          },
        },
        version: 2,
      })
    ).toEqual({
      terms: {
        '202105': {
          versions: {
            sv_48RC7kqO7YDiBK66qXOd: {
              name: 'Primary',
              createdAt: '2021-09-15T23:57:40.270Z',
              schedule: {
                desiredCourses: [],
                pinnedCrns: [],
                excludedCrns: [],
                events: [],
                colorMap: {},
                sortingOptionIndex: 0,
              },
              friends: {},
            },
          },
        },
        '202108': {
          versions: {
            sv_ZUK7Uca9vvBhUn2lcXWb: {
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
    });
  });
});
