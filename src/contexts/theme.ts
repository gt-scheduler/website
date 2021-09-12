import React from 'react';

import { ErrorWithFields } from '../log';
import { Theme } from '../types';

export type ThemeContextValue = [Theme, (next: Theme) => void];
export const ThemeContext = React.createContext<ThemeContextValue>([
  'light',
  (next: Theme): void => {
    throw new ErrorWithFields({
      message: 'empty ThemeContext.setTheme value being used',
      fields: {
        next,
      },
    });
  },
]);
