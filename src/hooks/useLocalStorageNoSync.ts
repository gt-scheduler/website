import { useState } from 'react';

import { ErrorWithFields, softError } from '../log';

export type HookResult<T> = [T, (value: T | ((curr: T) => T)) => void];

/**
 * From https://usehooks.com/useLocalStorage/.
 * Similar to `use-local-storage-state` (which should be preferred),
 * except it does not sync the state between browser tabs.
 */
export default function useLocalStorageNoSync<T>(
  key: string,
  initialValue: T
): HookResult<T> {
  const [storedValue, setStoredValue] = useState<T>(() => {
    let item: string | null = null;
    try {
      item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      softError(
        new ErrorWithFields({
          message: 'useLocalStorageNoSync load local storage failed',
          source: error,
          fields: {
            key,
          },
        })
      );
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)): void => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      softError(
        new ErrorWithFields({
          message: 'useLocalStorageNoSync setValue call failed',
          source: error,
          fields: {
            key,
          },
        })
      );
    }
  };

  return [storedValue, setValue];
}
