import React from 'react';
import {
  Theme,
  defaultScheduleData,
  ScheduleData,
  VersionsData
} from './types';
import Oscar from './beans/Oscar';

type Setter<T> = (next: T) => void;

export type ThemeContextValue = [theme: Theme, setTheme: Setter<Theme>];
/**
 * The theme context contains the current value of the app theme (dark or light)
 */
export const ThemeContext = React.createContext<ThemeContextValue>([
  'light',
  () => {}
]);

export type TermsContextValue = [
  allTerms: string[],
  setAllTerms: Setter<string[]>
];
/**
 * The terms context contains a list of all valid terms
 */
export const TermsContext = React.createContext<TermsContextValue>([
  [],
  () => {}
]);

export type VersionsContextValue = [
  VersionsData,
  { patchVersionsData: Setter<Partial<VersionsData>> }
];
/**
 * The versions context contains a map of terms -> version names
 */
export const VersionsContext = React.createContext<VersionsContextValue>([
  {},
  { patchVersionsData: () => {} }
]);

export type ScheduleContextData = {
  term: string;
  versionName: string;
  oscar: Oscar;
} & ScheduleData;
export type ScheduleContextSetters = {
  setTerm: Setter<string>;
  setVersionName: Setter<string>;
  setOscar: Setter<Oscar>;
  patchScheduleData: Setter<Partial<ScheduleData>>;
};
export type ScheduleContextValue = [
  ScheduleContextData,
  ScheduleContextSetters
];
/**
 * The schedule context contains all of the current schedule data
 * for the current's user's schedule given the current term.
 */
export const ScheduleContext = React.createContext<ScheduleContextValue>([
  {
    term: '',
    versionName: '',
    oscar: null as unknown as Oscar,
    ...defaultScheduleData
  },
  {
    setTerm: () => {},
    setVersionName: () => {},
    setOscar: () => {},
    patchScheduleData: () => {}
  }
]);

export type OverlayCrnsContextValue = [string[], Setter<string[]>];
/**
 * The overlay CRNs context stores a list of CRNs that are to be shown
 * as the overlay/transparent state on the calendar.
 */
export const OverlayCrnsContext = React.createContext<OverlayCrnsContextValue>([
  [],
  () => {}
]);
