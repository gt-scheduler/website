import { useEffect, useState } from 'react';

/**
 * Used to gate certain features behind opt-in developer feature flags.
 * These are stored in local storage, and can be enabled by setting to `true`
 * the local storage item with a key in the pattern of `ff-${date}-${key}`
 */
export default function useFeatureFlag(date: string, key: string): boolean {
  const derivedKey = `ff-${date}-${key}`;
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      if (window.localStorage.getItem(derivedKey) === 'true') return true;
      return false;
    } catch (_) {
      // Ignore
      return false;
    }
  });

  // Subscribe to updates
  useEffect(() => {
    const listener = (event: StorageEvent): void => {
      try {
        if (event.storageArea === localStorage && event.key === derivedKey) {
          setIsEnabled(event.newValue === 'true');
        }
      } catch (_) {
        // Ignore
      }
    };

    try {
      window.addEventListener('storage', listener, false);
      return (): void => {
        try {
          window.removeEventListener('storage', listener, false);
        } catch (_) {
          // Ignore
        }
      };
    } catch (_) {
      // Ignore
      return (): void => undefined;
    }
  });

  return isEnabled;
}
