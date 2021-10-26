import { generateRandomId, getNextVersionName } from './misc';

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

describe('generateRandomId', () => {
  it('generates random IDs of the given length', () => {
    const array10Elements = Array.from(Array(10).keys());
    const length0Ids = array10Elements.map(() => generateRandomId(0));
    const length4Ids = array10Elements.map(() => generateRandomId(4));
    const length30Ids = array10Elements.map(() => generateRandomId(30));

    length0Ids.forEach((id) => expect(id).toStrictEqual(''));
    length4Ids.forEach((id) => expect(id.length).toStrictEqual(4));
    length30Ids.forEach((id) => expect(id.length).toStrictEqual(30));
  });

  it('generates IDs with reasonable uniqueness', () => {
    const array10Elements = Array.from(Array(10).keys());

    // This isn't guaranteed to be a reliable test,
    // but the odds of collision (assuming full randomness)
    // are ~1 in 7e33
    const length20Ids = array10Elements.map(() => generateRandomId(20));
    const set = new Set(length20Ids);
    expect(set.size).toStrictEqual(10);
  });
});
