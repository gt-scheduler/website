/* eslint-disable import/prefer-default-export */

/**
 * Safely tries to get an element from an array.
 */
export function getFromArray<T>(
  arr: readonly Exclude<T, null | undefined>[],
  index: number
): T | null {
  try {
    if (index < 0 || index > arr.length - 1) return null;
    return arr[index] ?? null;
  } catch (_) {
    // ignore error
    return null;
  }
}
