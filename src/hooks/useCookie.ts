import { useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function useCookie(
  key: string
): [string | undefined, (next: string) => void] {
  const [value, setValue] = useState<string | undefined>(undefined);

  const setCookieValue = useCallback(
    (val) => {
      setValue(val);
      Cookies.set(key, val, { expires: 1460 });
    },
    [key, setValue]
  );

  useEffect(() => {
    let val;
    if (key !== undefined && key !== '') {
      val = Cookies.get(key);
    }
    setValue(val);
  }, [key]);

  return [value, setCookieValue];
}

export function useCookieWithDefault(
  key: string,
  defaultValue: string
): [string, (next: string) => void] {
  const [value, setValue] = useState<string>(defaultValue);

  const setCookieValue = useCallback(
    (val) => {
      setValue(val);
      Cookies.set(key, val, { expires: 1460 });
    },
    [key, setValue]
  );

  useEffect(() => {
    let val;
    if (key !== undefined) {
      val = Cookies.get(key);
    }
    setValue(val === undefined ? defaultValue : val);
  }, [key, defaultValue]);

  return [value, setCookieValue];
}
