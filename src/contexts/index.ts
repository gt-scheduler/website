import React from 'react';

import { Theme, defaultTermData, TermData } from '../types';
import Oscar, { EMPTY_OSCAR } from '../beans/Oscar';
import { ErrorWithFields } from '../log';

type Setter<T> = (next: T) => void;

export type ThemeContextValue = [Theme, Setter<Theme>];
export const ThemeContext = React.createContext<ThemeContextValue>([
  'light',
  (): void => {
    throw new ErrorWithFields({
      message: 'empty ThemeContext.setTheme value being used',
    });
  },
]);

export type TermsContextValue = [string[], Setter<string[]>];
export const TermsContext = React.createContext<TermsContextValue>([
  [],
  (): void => {
    throw new ErrorWithFields({
      message: 'empty TermsContext.setTerms value being used',
    });
  },
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
    ...defaultTermData,
  },
  {
    setTerm: (): void => {
      throw new ErrorWithFields({
        message: 'empty TermContext.setTerm value being used',
      });
    },
    setOscar: (): void => {
      throw new ErrorWithFields({
        message: 'empty TermContext.setOscar value being used',
      });
    },
    patchTermData: (): void => {
      throw new ErrorWithFields({
        message: 'empty TermContext.patchTermData value being used',
      });
    },
  },
]);

export type OverlayCrnsContextValue = [string[], Setter<string[]>];
export const OverlayCrnsContext = React.createContext<OverlayCrnsContextValue>([
  [],
  (): void => {
    throw new ErrorWithFields({
      message: 'empty OverlayCrnsContext.setOverlayCrns value being used',
    });
  },
]);
