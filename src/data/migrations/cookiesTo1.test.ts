import { disableLogging } from '../../utils/tests';
import migrateCookiesTo1 from './cookiesTo1';

describe('trySourceScheduleDataFromCookies', () => {
  // Tests that, in the absence of any cookies being present,
  // the function returns the default, un-migrated data.
  // Do not update these tests if adding new versions/migrations
  // (instead, add new ones for the migrations).
  it('returns default data with no cookies', () => {
    expect(migrateCookiesTo1({})).toEqual({
      terms: {},
      currentTerm: '',
      version: 1,
    });
  });

  // Tests that a set of real cookie values from the production site
  // are correctly converted into the version 1 schedule data.
  it('returns the expected value with complex cookies', () => {
    expect(
      migrateCookiesTo1({
        '202008': JSON.stringify({
          desiredCourses: ['CS 1331'],
          pinnedCrns: ['87086'],
          excludedCrns: [],
          colorMap: { 'CS 1331': '#808080' },
          sortingOptionIndex: 0,
        }),
        '202102': JSON.stringify({
          desiredCourses: ['CS 1332', 'CS 2050'],
          pinnedCrns: ['24144', '22787'],
          excludedCrns: [],
          colorMap: { 'CS 1332': '#653294', 'CS 2050': '#009CE0' },
          sortingOptionIndex: 0,
        }),
        '202105': JSON.stringify({
          desiredCourses: [],
          pinnedCrns: [],
          excludedCrns: [],
          colorMap: {},
          sortingOptionIndex: 0,
        }),
        '202108': JSON.stringify({
          desiredCourses: ['CS 1100', 'CS 1331'],
          pinnedCrns: ['87695', '82294', '88999', '90769', '89255', '94424'],
          excludedCrns: ['95199'],
          colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
          sortingOptionIndex: 0,
        }),
        term: '202108',
        // All of these cookies should be ignored
        theme: 'dark',
        visited: 'true',
        'visited-merge-notice': 'true',
        _ga: 'GA1.1.1552067079.1630814925',
        _ga_TPJQQ46MS9: 'GS1.1.1631232471.17.1.1631232472.0',
      })
    ).toEqual({
      terms: {
        '202008': {
          versions: [
            {
              name: 'Primary',
              schedule: {
                desiredCourses: ['CS 1331'],
                pinnedCrns: ['87086'],
                excludedCrns: [],
                colorMap: { 'CS 1331': '#808080' },
                sortingOptionIndex: 0,
              },
            },
          ],
          currentIndex: 0,
        },
        '202102': {
          versions: [
            {
              name: 'Primary',
              schedule: {
                desiredCourses: ['CS 1332', 'CS 2050'],
                pinnedCrns: ['24144', '22787'],
                excludedCrns: [],
                colorMap: { 'CS 1332': '#653294', 'CS 2050': '#009CE0' },
                sortingOptionIndex: 0,
              },
            },
          ],
          currentIndex: 0,
        },
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
    });
  });

  // Tests that invalid input doesn't cause the parser to crash,
  // and data is either extracted from the input whenever possible
  // or falls back to the default schedule data.
  it('falls back to the default schedule with invalid input when appropriate', () => {
    // Disable console.* commands for this test
    // since it purposefully causes errors
    disableLogging();

    expect(
      migrateCookiesTo1({
        '202008': '',
        '202102': '{}',
        '202105': '{',
        '202108': 'undefined',
        '199905': '{"desiredCourses":["CS 1100","CS 1331"]}',
        term: '202008',
      })
    ).toEqual({
      terms: {
        '202102': {
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
        '199905': {
          versions: [
            {
              name: 'Primary',
              schedule: {
                desiredCourses: ['CS 1100', 'CS 1331'],
                pinnedCrns: [],
                excludedCrns: [],
                colorMap: {},
                sortingOptionIndex: 0,
              },
            },
          ],
          currentIndex: 0,
        },
      },
      currentTerm: '202008',
      version: 1,
    });
  });
});
