import { useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export function useCookie(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);

  const setCookieValue = useCallback(value => {
    setValue(value);
    Cookies.set(key, value);
  }, [key, setValue]);

  useEffect(() => {
    let value;
    if (key !== undefined) {
      value = Cookies.get(key);
    }
    setValue(value === undefined ? defaultValue : value);
  }, [key, defaultValue]);

  return [value, setCookieValue];
}
