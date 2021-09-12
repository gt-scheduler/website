import React, { useMemo } from 'react';

import { Oscar } from '../../data/beans';
import {
  ScheduleContextValue,
  TermsContext,
  ScheduleContext,
} from '../../contexts';
import useDownloadOscarData from '../../hooks/data/useDownloadOscarData';
import useDownloadTerms from '../../hooks/data/useDownloadTerms';
import useTermDataFromCookies from '../../hooks/data/useTermDataFromCookies';
import useTermFromCookies from '../../hooks/data/useTermFromCookies';
import { TermData } from '../../types';
import LoadingDisplay from '../LoadingDisplay';
import {
  AppSkeletonWithLoadingTerms,
  SkeletonContent,
  AppSkeletonWithSwitchableTerms,
} from './content';

export type LoadTermsProps = {
  children: (props: { terms: string[] }) => React.ReactNode;
};

/**
 * Handles loading the list of terms from the GitHub API upon first mount,
 * showing loading and error states as needed.
 * Renders a disabled header & attribution footer even when loading.
 * Once the terms are loaded, this renders `<EnsureValidTerm>` with the terms.
 */
export function LoadTerms({ children }: LoadTermsProps): React.ReactElement {
  const loadingState = useDownloadTerms();

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeletonWithLoadingTerms>
        <SkeletonContent>
          <LoadingDisplay state={loadingState} name="list of current terms" />
        </SkeletonContent>
      </AppSkeletonWithLoadingTerms>
    );
  }

  return <>{children({ terms: loadingState.result })}</>;
}

export type EnsureValidTermProps = {
  terms: string[];
  children: (props: {
    term: string;
    setTerm: (next: string) => void;
  }) => React.ReactNode;
};

/**
 * Handles loading the term from cookies and ensuring it has a valid value
 * before passing it to `<LoadOscarData>`.
 */
export function EnsureValidTerm({
  children,
  terms,
}: EnsureValidTermProps): React.ReactElement {
  const loadingState = useTermFromCookies(terms);

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeletonWithLoadingTerms>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="currently selected term from cookies"
          />
        </SkeletonContent>
      </AppSkeletonWithLoadingTerms>
    );
  }

  const [term, setTerm] = loadingState.result;
  return <>{children({ term, setTerm })}</>;
}

/**
 * Loads the instance of the `Oscar` bean from the crawled data,
 * showing loading and error states as needed.
 * Renders a disabled header & attribution footer even when loading.
 * Once the oscar bean is loaded, this renders `<EnsureValidTermData>`
 * with the data.
 */
export type LoadOscarDataProps = {
  terms: string[];
  term: string;
  setTerm: (next: string) => void;
  children: (props: { oscar: Oscar }) => React.ReactNode;
};

export function LoadOscarData({
  terms,
  term,
  setTerm,
  children,
}: LoadOscarDataProps): React.ReactElement {
  const loadingState = useDownloadOscarData(term);

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeletonWithSwitchableTerms
        terms={terms}
        currentTerm={term}
        onChangeTerm={setTerm}
      >
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="Oscar course data for the current term"
          />
        </SkeletonContent>
      </AppSkeletonWithSwitchableTerms>
    );
  }

  return <>{children({ oscar: loadingState.result })}</>;
}

export type EnsureValidTermDataProps = {
  terms: string[];
  term: string;
  setTerm: (next: string) => void;
  oscar: Oscar;
  children: (props: {
    termData: TermData;
    patchSchedule: (patch: Partial<TermData>) => void;
  }) => React.ReactNode;
};

/**
 * Handles loading term data from cookies and ensuring it has a valid value
 * before passing it to `<AppContextProvider>`
 */
export function EnsureValidTermData({
  terms,
  term,
  setTerm,
  oscar,
  children,
}: EnsureValidTermDataProps): React.ReactElement {
  // This hook doesn't support changing `term` without the parent context
  // (this component) un-mounting & re-mounting.
  // Luckily, whenever the term is changed, `oscar` is invalidated and reloaded,
  // which causes this component to not be rendered until it is loaded again.
  const loadingState = useTermDataFromCookies(term, oscar);

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeletonWithSwitchableTerms
        terms={terms}
        currentTerm={term}
        onChangeTerm={setTerm}
      >
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="saved schedule from cookies"
          />
        </SkeletonContent>
      </AppSkeletonWithSwitchableTerms>
    );
  }

  const [termData, patchSchedule] = loadingState.result;
  return <>{children({ termData, patchSchedule })}</>;
}

export type AppContextProviderProps = {
  terms: string[];
  term: string;
  setTerm: (next: string) => void;
  oscar: Oscar;
  termData: TermData;
  patchSchedule: (patch: Partial<TermData>) => void;
  children: React.ReactNode;
};

/**
 * Handles making all loaded data available to the rest of the app
 * via the contexts `TermsContext` and `ScheduleContext`.
 */
export function AppContextProvider({
  terms,
  term,
  setTerm,
  oscar,
  termData,
  patchSchedule,
  children,
}: AppContextProviderProps): React.ReactElement {
  // Memoize context values so that their references are stable
  const scheduleContextValue = useMemo<ScheduleContextValue>(
    () => [
      { term, oscar, ...termData },
      { setTerm, patchSchedule },
    ],
    [term, oscar, termData, setTerm, patchSchedule]
  );

  return (
    <TermsContext.Provider value={terms}>
      <ScheduleContext.Provider value={scheduleContextValue}>
        {children}
      </ScheduleContext.Provider>
    </TermsContext.Provider>
  );
}
