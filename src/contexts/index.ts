import React from 'react';

import { Theme, defaultTermData, TermData } from '../types';
import Oscar, { EMPTY_OSCAR } from '../beans/Oscar';
import { ErrorWithFields } from '../log';

type Setter<T> = (next: T) => void;

export type ThemeContextValue = [Theme, Setter<Theme>];
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

export type TermsContextValue = string[];
export const TermsContext = React.createContext<TermsContextValue>([]);

export type TermContextData = {
  term: string;
  oscar: Oscar;
} & TermData;
export type TermContextSetters = {
  setTerm: Setter<string>;
  patchTermData: Setter<Partial<TermData>>;
};
export type TermContextValue = [TermContextData, TermContextSetters];
export const TermContext = React.createContext<TermContextValue>([
  {
    term: '',
    oscar: EMPTY_OSCAR,
    ...defaultTermData,
  },
  {
    setTerm: (next: string): void => {
      throw new ErrorWithFields({
        message: 'empty TermContext.setTerm value being used',
        fields: {
          next,
        },
      });
    },
    patchTermData: (patch: Partial<TermData>): void => {
      throw new ErrorWithFields({
        message: 'empty TermContext.patchTermData value being used',
        fields: {
          patch,
        },
      });
    },
  },
]);

export type OverlayCrnsContextValue = [string[], Setter<string[]>];
export const OverlayCrnsContext = React.createContext<OverlayCrnsContextValue>([
  [],
  (next: string[]): void => {
    throw new ErrorWithFields({
      message: 'empty OverlayCrnsContext.setOverlayCrns value being used',
      fields: {
        next,
      },
    });
  },
]);
