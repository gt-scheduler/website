import { useCallback, useMemo } from 'react';

import { useCookie } from '.';
import { hardError } from '../log';

export default function useJsonCookie<
  T extends Record<string, unknown> | Array<unknown>
>(key: string, defaultValue: T): [T, (patch: Partial<T>) => void] {
  const [rawValue, setRawValue] = useCookie(key);

  const value = useMemo(() => {
    if (rawValue !== undefined) {
      try {
        const parsedValue = JSON.parse(rawValue) as T;
        return {
          ...defaultValue,
          ...parsedValue
        };
      } catch (err) {
        hardError(`failed to parse cookie data`, err, {
          rawValue,
          key,
          defaultValue
        });
      }
    }
    return defaultValue;
  }, [rawValue, defaultValue]);

  const patchValue = useCallback(
    (patch) => {
      const rawVal = JSON.stringify({
        ...value,
        ...patch
      });
      setRawValue(rawVal);
    },
    [value, setRawValue]
  );

  return [value, patchValue];
}
