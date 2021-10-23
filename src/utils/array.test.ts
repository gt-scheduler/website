import { getFromArray } from './array';

describe('getFromArray', () => {
  it('works on normal arrays', () => {
    const arr = [10, 20, 30, 40, 50, 'hi'];

    expect(getFromArray(arr, 0)).toStrictEqual(10);
    expect(getFromArray(arr, 1)).toStrictEqual(20);
    expect(getFromArray(arr, 2)).toStrictEqual(30);
    expect(getFromArray(arr, 3)).toStrictEqual(40);
    expect(getFromArray(arr, 4)).toStrictEqual(50);
    expect(getFromArray(arr, 5)).toStrictEqual('hi');
    expect(getFromArray(arr, 6)).toStrictEqual(null);
    expect(getFromArray(arr, 13)).toStrictEqual(null);
    expect(getFromArray(arr, 1245)).toStrictEqual(null);
    expect(getFromArray(arr, -1)).toStrictEqual(null);
  });

  it('works on sparse arrays', () => {
    const arr = [];
    arr[14] = 10;
    arr[290] = 'hi';
    arr[391] = 0.9;

    expect(getFromArray(arr, 0)).toStrictEqual(null);
    expect(getFromArray(arr, 1)).toStrictEqual(null);
    expect(getFromArray(arr, 13)).toStrictEqual(null);
    expect(getFromArray(arr, 14)).toStrictEqual(10);
    expect(getFromArray(arr, 15)).toStrictEqual(null);
    expect(getFromArray(arr, 290)).toStrictEqual('hi');
    expect(getFromArray(arr, 391)).toStrictEqual(0.9);
    expect(getFromArray(arr, 392)).toStrictEqual(null);
    expect(getFromArray(arr, -1)).toStrictEqual(null);
  });
});
