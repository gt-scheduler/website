import React from 'react';

import { Theme, defaultTermData, TermData } from '../types';
import Oscar, { EMPTY_OSCAR } from '../beans/Oscar';
import { hardError } from '../log';

type Setter<T> = (next: T) => void;

export type ThemeContextValue = [Theme, Setter<Theme>];
export const ThemeContext = React.createContext<ThemeContextValue>([
  'light',
  (): void => {
    hardError('empty ThemeContext.setTheme value being used', null);
  }
]);

export type TermsContextValue = [string[], Setter<string[]>];
export const TermsContext = React.createContext<TermsContextValue>([
  [],
  (): void => {
    hardError('empty TermsContext.setTerms value being used', null);
  }
]);

export type TermContextData = {
  term: string;
  oscar: Oscar;
} & TermData;
export type TermContextSetters = {
  setTerm: Setter<string>;
  setOscar: Setter<Oscar>;
  patchTermData: Setter<Partial<TermData>>;
};
export type TermContextValue = [TermContextData, TermContextSetters];
export const TermContext = React.createContext<TermContextValue>([
  {
    term: '',
    oscar: EMPTY_OSCAR,
    ...defaultTermData
  },
  {
    setTerm: (): void => {
      hardError('empty TermContext.setTerm value being used', null);
    },
    setOscar: (): void => {
      hardError('empty TermContext.setOscar value being used', null);
    },
    patchTermData: (): void => {
      hardError('empty TermContext.patchTermData value being used', null);
    }
  }
]);

export type OverlayCrnsContextValue = [string[], Setter<string[]>];
export const OverlayCrnsContext = React.createContext<OverlayCrnsContextValue>([
  [],
  (): void => {
    hardError('empty OverlayCrnsContext.setOverlayCrns value being used', null);
  }
]);
