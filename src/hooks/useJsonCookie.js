import { useCallback, useMemo, useRef } from 'react';
import { useCookie } from '.';

export default function useJsonCookie(key, defaultValue) {
  const [rawValue, setRawValue] = useCookie(key);

  const value = useMemo(() => {
    if (rawValue !== undefined) {
      const parsedValue = JSON.parse(rawValue);
      return {
        ...defaultValue,
        ...parsedValue
      };
    }
    return defaultValue;
  }, [rawValue, defaultValue]);

  // Obtain a stable ref to value so that patchValue can also be stable
  const valueRef = useRef(value);
  valueRef.current = value;

  const patchValue = useCallback(
    (patch) => {
      const rawVal = JSON.stringify({
        ...valueRef.current,
        ...patch
      });
      setRawValue(rawVal);
    },
    [valueRef, setRawValue]
  );

  return [value, patchValue];
}
