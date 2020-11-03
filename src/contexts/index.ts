import React from 'react';
import { Theme, defaultTermData, TermData } from '../types';
import Oscar from '../beans/Oscar';

type Setter<T> = (next: T) => void;

export type ThemeContextValue = [Theme, Setter<Theme>];
export const ThemeContext = React.createContext<ThemeContextValue>([
  'light',
  () => {}
]);

export type TermsContextValue = [string[], Setter<string[]>];
export const TermsContext = React.createContext<TermsContextValue>([
  [],
  () => {}
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
    oscar: (null as unknown) as Oscar,
    ...defaultTermData
  },
  {
    setTerm: () => {},
    setOscar: () => {},
    patchTermData: () => {}
  }
]);

export type OverlayCrnsContextValue = [string[], Setter<string[]>];
export const OverlayCrnsContext = React.createContext<OverlayCrnsContextValue>([
  [],
  () => {}
]);
