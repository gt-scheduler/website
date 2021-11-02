/* eslint-disable import/prefer-default-export */

import { createLocalStorageStateHook } from 'use-local-storage-state';

/**
 * Used to gate certain features behind opt-in developer feature flags.
 * These are stored in local storage, and can be enabled by setting to `true`
 * the local storage item with a key in the pattern of `ff-${date}-${key}`.
 * Use `YYYY-MM-DD` as the day format;
 * this ensures that feature flag keys are globally unique.
 * To use this, create a new line below this function that says something like:
 *
 * ```js
 * export const useFooBarFeatureFlag =
 *   createFeatureFlag('2072-11-03', 'foo-bar');
 * ```
 *
 * Then, import `useFooBar` whenever needed.
 */
function createFeatureFlag(
  date: string,
  key: string,
  { enabledInDevelopment = false }: { enabledInDevelopment?: boolean }
): () => boolean {
  const derivedKey = `ff-${date}-${key}`;
  const useFeatureFlag = createLocalStorageStateHook(derivedKey, false);
  return (): boolean => {
    const [currentValue] = useFeatureFlag();

    // If enabled in development, always return true.
    if (enabledInDevelopment && process.env.NODE_ENV === 'development')
      return true;

    return currentValue;
  };
}

export const useCourseCatalogFeatureFlag = createFeatureFlag(
  '2021-10-30',
  'course-catalog',
  { enabledInDevelopment: true }
);
