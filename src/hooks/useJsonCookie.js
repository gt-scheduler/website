import { useCallback, useMemo } from 'react';
import { useCookie } from './';

export function useJsonCookie(key, defaultValue) {
  const [rawValue, setRawValue] = useCookie(key);

  const value = useMemo(() => {
    if (rawValue !== undefined) {
      const parsedValue = JSON.parse(rawValue);
      return {
        ...defaultValue,
        ...parsedValue,
      };
    }
    return defaultValue;
  }, [rawValue, defaultValue]);

  const patchValue = useCallback(patch => {
    const rawValue = JSON.stringify({
      ...value,
      ...patch,
    });
    setRawValue(rawValue);
  }, [value, setRawValue]);

  return [value, patchValue];
}
