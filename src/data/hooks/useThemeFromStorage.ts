import Cookies from 'js-cookie';
import { useEffect, useMemo } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { ThemeContextValue } from '../../contexts';
import { isTheme } from '../../types';

const THEME_LOCAL_STORAGE_KEY = 'theme';

/**
 * Loads the current UI theme (light/dark) from local storage,
 * falling back to the legacy cookies-based storage if necessary.
 * Returns a memoized value of the theme context.
 */
export default function useThemeFromStorage(): ThemeContextValue {
  // Grab the cookie value, if it exists, and use it as the default value
  // for the local storage state.
  const maybeLegacyValue = Cookies.get(THEME_LOCAL_STORAGE_KEY);
  const legacyValue =
    maybeLegacyValue !== undefined ? maybeLegacyValue : 'dark';

  const [theme, setTheme] = useLocalStorageState(THEME_LOCAL_STORAGE_KEY, {
    defaultValue: legacyValue,
    storageSync: true,
  });
  const correctedTheme = isTheme(theme) ? theme : 'dark';

  // Ensure that the stored theme is valid; otherwise reset it
  useEffect(() => {
    if (theme !== correctedTheme) {
      setTheme(correctedTheme);
    }
  }, [theme, correctedTheme, setTheme]);

  const themeContextValue = useMemo<ThemeContextValue>(
    () => [correctedTheme, setTheme],
    [correctedTheme, setTheme]
  );

  return themeContextValue;
}
