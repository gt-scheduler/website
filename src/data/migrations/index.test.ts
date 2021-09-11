import Cookies from 'js-cookie';

import migrateScheduleData from '.';
import { asMockFunction } from '../../utils/tests';

// Mock the `Cookies` object so we can set values
jest.mock('js-cookie');
// eslint-disable-next-line jest/unbound-method
const cookiesGet = Cookies.get;

// Note: the expected output of these tests should be updated
// whenever adding new migrations (to reflective the cumulative effect
// of applying all migrations after the one we're testing).
// This is fine: individual migrations should be tested elsewhere.
describe('migrateScheduleData', () => {
  // Tests the "migration" from version 0 (null/data in cookies) to version 1
  it('migrates data given schedule version 0 (null)', () => {
    // The data in this case from cookies, so use the mocked cookiesGet
    asMockFunction(cookiesGet).mockReturnValue({
      '202108':
        '{"desiredCourses":["CS 1100","CS 1331"],"pinnedCrns":["87695","82294","88999","90769","89255","94424"],"excludedCrns":["95199"],"colorMap":{"CS 1100":"#0062B1","CS 1331":"#194D33"},"sortingOptionIndex":0}',
      term: '202108',
    });

    expect(migrateScheduleData(null)).toEqual({
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
    });
  });

  it('migrates data given schedule version 1', () => {
    expect(
      migrateScheduleData({
        terms: {
          '202105': {
            versions: {
              Primary: {
                desiredCourses: [],
                pinnedCrns: [],
                excludedCrns: [],
                colorMap: {},
                sortingOptionIndex: 0,
              },
            },
            currentVersion: 'Primary',
          },
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
        currentTerm: '202108',
        version: 1,
      })
    ).toEqual({
      terms: {
        '202105': {
          versions: {
            Primary: {
              desiredCourses: [],
              pinnedCrns: [],
              excludedCrns: [],
              colorMap: {},
              sortingOptionIndex: 0,
            },
          },
          currentVersion: 'Primary',
        },
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
      currentTerm: '202108',
      version: 1,
    });
  });
});
