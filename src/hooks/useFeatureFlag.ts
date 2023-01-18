import useLocalStorageState from 'use-local-storage-state';

/**
 * Used to gate certain features behind opt-in developer feature flags.
 * These are stored in local storage, and can be enabled by setting to `true`
 * the local storage item with a key in the pattern of `ff-${date}-${key}`
 */
export default function useFeatureFlag(date: string, key: string): boolean {
  const derivedKey = `ff-${date}-${key}`;
  const [isEnabled] = useLocalStorageState<boolean>(derivedKey, {
    defaultValue: false,
    storageSync: true,
  });
  return isEnabled;
}
