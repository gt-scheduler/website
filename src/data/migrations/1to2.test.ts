import { asMockFunction } from '../../utils/tests';
import * as dataTypes from '../types';
import migrate1To2 from './1to2';

describe('migrate1to2', () => {
  it('handles a migration with no term data', () => {
    expect(
      migrate1To2({
        version: 1,
        currentTerm: '',
        terms: {},
      })
    ).toEqual({
      version: 2,
      terms: {},
    });
  });

  it('handles a migration with no schedule versions', () => {
    expect(
      migrate1To2({
        version: 1,
        currentTerm: '202008',
        terms: {
          202008: {
            currentIndex: 0,
            versions: [],
          },
        },
      })
    ).toEqual({
      version: 2,
      terms: {
        202008: {
          versions: {},
        },
      },
    });
  });

  it('handles a migration with multiple schedule versions', () => {
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

    expect(
      migrate1To2({
        version: 1,
        currentTerm: '202008',
        terms: {
          202008: {
            currentIndex: 0,
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
              {
                name: 'Secondary',
                schedule: {
                  desiredCourses: [],
                  pinnedCrns: [],
                  excludedCrns: [],
                  colorMap: {},
                  sortingOptionIndex: 0,
                },
              },
              {
                name: 'Tertiary',
                schedule: {
                  desiredCourses: [],
                  pinnedCrns: [],
                  excludedCrns: [],
                  colorMap: {},
                  sortingOptionIndex: 0,
                },
              },
            ],
          },
        },
      })
    ).toEqual({
      version: 2,
      terms: {
        202008: {
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
                colorMap: { 'CS 1100': '#0062B1', 'CS 1331': '#194D33' },
                sortingOptionIndex: 0,
              },
            },
            sv_00000000000000000001: {
              name: 'Secondary',
              // January 1, 1970 at 1 second
              createdAt: '1970-01-01T00:00:01.000Z',
              schedule: {
                desiredCourses: [],
                pinnedCrns: [],
                excludedCrns: [],
                colorMap: {},
                sortingOptionIndex: 0,
              },
            },
            sv_00000000000000000002: {
              name: 'Tertiary',
              // January 1, 1970 at 2 seconds
              createdAt: '1970-01-01T00:00:02.000Z',
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
      },
    });
  });
});
