import { useCallback, useState } from 'react';
import Cookies from 'js-cookie';

/**
 * Gets the latest value of a cookie,
 * providing a callback that updates the state (causing a re-render)
 * and persists the new value to the cookie.
 * Does not support `key` changing between calls to `useCookie`
 * without the parent context unmounting & remounting.
 */
export default function useCookie(
  key: string,
  defaultValue: string
): [string, (next: string) => void] {
  const [value, setValue] = useState<string>(() => {
    const val = Cookies.get(key);
    if (val !== undefined) return val;

    // Use the default value, persisting it to cookies
    Cookies.set(key, defaultValue, { expires: 1460 });
    return defaultValue;
  });

  const setCookieValue = useCallback(
    (val) => {
      setValue(val);
      Cookies.set(key, val, { expires: 1460 });
    },
    [key, setValue]
  );

  return [value, setCookieValue];
}
