import { useCallback, useMemo } from 'react';

import { useCookie } from '.';
import { ErrorWithFields } from '../log';

export default function useJsonCookie<T extends Record<string, unknown>>(
  key: string,
  defaultValue: T
): [T, (patch: Partial<T>) => void] {
  const [rawValue, setRawValue] = useCookie(key);

  const value = useMemo(() => {
    if (rawValue !== undefined) {
      try {
        const parsedValue = JSON.parse(rawValue) as T;
        return {
          ...defaultValue,
          ...parsedValue,
        };
      } catch (err) {
        throw new ErrorWithFields({
          message: `failed to parse cookie data`,
          source: err,
          fields: {
            rawValue,
            key,
            defaultValue,
          },
        });
      }
    }
    return defaultValue;
  }, [key, rawValue, defaultValue]);

  const patchValue = useCallback(
    (patch) => {
      const rawVal = JSON.stringify({
        ...value,
        ...patch,
      });
      setRawValue(rawVal);
    },
    [value, setRawValue]
  );

  return [value, patchValue];
}
