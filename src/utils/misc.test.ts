import { getNextVersionName } from './misc';

describe('getNextVersionName', () => {
  it('returns Primary if the list is empty', () => {
    expect(getNextVersionName([])).toEqual('Primary');
  });

  it('returns elements in the sequence', () => {
    const tests = [
      {
        input: ['Primary'],
        expected: 'Secondary',
      },
      {
        input: ['Primary', 'Secondary'],
        expected: 'Tertiary',
      },
      {
        input: ['Primary', 'Secondary', 'Tertiary'],
        expected: 'Quaternary',
      },
      {
        input: ['Primary', 'Secondary', 'Tertiary', 'Quaternary'],
        expected: 'Quinary',
      },
      {
        input: ['Primary', 'Secondary', 'Tertiary', 'Quaternary', 'Quinary'],
        expected: 'Senary',
      },
      {
        input: [
          'Primary',
          'Secondary',
          'Tertiary',
          'Quaternary',
          'Quinary',
          'Senary',
        ],
        expected: 'Septenary',
      },
      {
        input: [
          'Primary',
          'Secondary',
          'Tertiary',
          'Quaternary',
          'Quinary',
          'Senary',
          'Septenary',
        ],
        expected: 'Octonary',
      },
      {
        input: [
          'Primary',
          'Secondary',
          'Tertiary',
          'Quaternary',
          'Quinary',
          'Senary',
          'Septenary',
          'Octonary',
        ],
        expected: 'Nonary',
      },
      {
        input: [
          'Primary',
          'Secondary',
          'Tertiary',
          'Quaternary',
          'Quinary',
          'Senary',
          'Septenary',
          'Octonary',
          'Nonary',
        ],
        expected: 'Denary',
      },
    ];

    tests.forEach(({ input, expected }) => {
      expect(getNextVersionName(input)).toEqual(expected);
    });
  });

  it("doesn't return Primary if the list is non-empty", () => {
    expect(getNextVersionName(['SomeOtherVersionName'])).toEqual('Secondary');
    expect(getNextVersionName(['SomeOtherVersionName', 'Secondary'])).toEqual(
      'Tertiary'
    );
  });

  it('returns a fallback if the default names are exhausted', () => {
    expect(
      getNextVersionName([
        'Primary',
        'Secondary',
        'Tertiary',
        'Quaternary',
        'Quinary',
        'Senary',
        'Septenary',
        'Octonary',
        'Nonary',
        'Denary',
      ])
    ).toEqual('New version');
  });
});
