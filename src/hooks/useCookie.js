import { useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function useCookie(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);

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
