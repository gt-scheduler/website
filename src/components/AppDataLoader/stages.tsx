import React, { useCallback } from 'react';
import { Immutable, Draft } from 'immer';

import { Oscar } from '../../data/beans';
import useDownloadOscarData from '../../data/hooks/useDownloadOscarData';
import useDownloadTerms from '../../data/hooks/useDownloadTerms';
import { NonEmptyArray } from '../../types';
import LoadingDisplay from '../LoadingDisplay';
import {
  AppSkeletonWithLoadingTerms,
  SkeletonContent,
  AppSkeletonWithSwitchableTerms,
} from '../App/content';
import {
  ScheduleData,
  ScheduleVersion,
  TermScheduleData,
} from '../../data/types';
import useScheduleDataFromStorage from '../../data/hooks/useScheduleDataFromStorage';
import { ErrorWithFields } from '../../log';
import useExtractSchedule from '../../data/hooks/useExtractScheduleVersion';
import useExtractTermScheduleData from '../../data/hooks/useExtractTermScheduleData';

// Each of the components in this file is a "stage" --
// a component that takes in a render function for its `children` prop
// that it uses to pass in the results of the stage on to the next one.
// If a stage is loading or has an error,
// then it renders its own loading/error view
// and does not call its `children` prop,
// effectively "stopping" the loading chain at that stage.
//
// The problem that this design solves is needing to perform
// a series of operations, whether data fetching or maintaining invariants
// (like having a valid current term/version),
// where an operation depends on the results of previous action(s).
// For example, ensuring that the current term is valid
// depends on fetching the list of terms from the GitHub API,
// so having them be two separate stages naturally encodes this dependency.

export type StageLoadScheduleDataProps = {
  children: (props: {
    scheduleData: Immutable<ScheduleData>;
    // This is similar to a function like `(next: ScheduleData) => void`
    // in that it lets callers update the schedule data, but it uses Immer.js
    // to provide a mutable "draft" that allows callers to treat
    // the parameter given in the callback as if it can be directly mutated.
    // This saves verbose code that is normally used to deeply clone objects
    // before changing them whenever immutable state updates are needed
    // (which is common in React apps).
    // Read more about it here: https://immerjs.github.io/immer/
    //
    // This function allows the schedule data to be edited in 1 of 2 ways:
    // 1. the draft parameter is mutated, and the function returns nothing/void
    // 2. the draft parameter is not mutated
    //    (it can still be used, just not mutated)
    //    and the function returns the new state to use.
    //    This is similar to a traditional setState callback
    updateScheduleData: (
      applyDraft: (draft: Draft<ScheduleData>) => void | Immutable<ScheduleData>
    ) => void;
    setTerm: (next: string) => void;
  }) => React.ReactNode;
};

/**
 * Handles loading the local schedule data from local storage,
 * handling migrating it to a newer version as needed.
 * Renders a disabled header & attribution footer even when loading.
 */
export function StageLoadScheduleData({
  children,
}: StageLoadScheduleDataProps): React.ReactElement {
  const loadingState = useScheduleDataFromStorage();

  // We'll need `setTerm` in a few places, so we just construct here
  // and send it to the children that we render.
  const maybeUpdateScheduleData =
    loadingState.type === 'loaded'
      ? loadingState.result.updateScheduleData
      : null;
  const setTerm = useCallback(
    (nextTerm: string): void => {
      if (maybeUpdateScheduleData === null) {
        throw new ErrorWithFields({
          message: 'setTerm called when schedule data was not loaded yet',
          fields: {
            nextTerm,
          },
        });
      }

      maybeUpdateScheduleData((draft) => {
        draft.currentTerm = nextTerm;
      });
    },
    [maybeUpdateScheduleData]
  );

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeletonWithLoadingTerms>
        <SkeletonContent>
          <LoadingDisplay state={loadingState} name="local schedule data" />
        </SkeletonContent>
      </AppSkeletonWithLoadingTerms>
    );
  }

  return <>{children({ ...loadingState.result, setTerm })}</>;
}

export type StageLoadTermsProps = {
  children: (props: { terms: NonEmptyArray<string> }) => React.ReactNode;
};

/**
 * Handles loading the list of terms from the GitHub API upon first mount,
 * showing loading and error states as needed.
 * Renders a disabled header & attribution footer even when loading.
 */
export function StageLoadTerms({
  children,
}: StageLoadTermsProps): React.ReactElement {
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

export type StageExtractTermScheduleDataProps = {
  terms: NonEmptyArray<string>;
  scheduleData: Immutable<ScheduleData>;
  updateScheduleData: (
    applyDraft: (draft: Draft<ScheduleData>) => void | Immutable<ScheduleData>
  ) => void;
  children: (props: {
    currentTerm: string;
    termScheduleData: Immutable<TermScheduleData>;
    // This function allows the term schedule data to be edited in 1 of 2 ways:
    // 1. the draft parameter is mutated, and the function returns nothing/void
    // 2. the draft parameter is not mutated
    //    (it can still be used, just not mutated)
    //    and the function returns the new state to use.
    //    This is similar to a traditional setState callback
    updateTermScheduleData: (
      applyDraft: (
        draft: Draft<TermScheduleData>
      ) => void | Immutable<TermScheduleData>
    ) => void;
  }) => React.ReactNode;
};

/**
 * Handles extracting the term schedule data from the parent schedule data,
 * ensuring that the term is valid before rendering its children.
 */
export function StageExtractTermScheduleData({
  terms,
  scheduleData,
  updateScheduleData,
  children,
}: StageExtractTermScheduleDataProps): React.ReactElement {
  const loadingState = useExtractTermScheduleData(
    terms,
    scheduleData,
    updateScheduleData
  );

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeletonWithLoadingTerms>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="schedule data for the current term"
          />
        </SkeletonContent>
      </AppSkeletonWithLoadingTerms>
    );
  }

  return <>{children({ ...loadingState.result })}</>;
}

/**
 * Loads the instance of the `Oscar` bean from the crawled data,
 * showing loading and error states as needed.
 * Renders a disabled header & attribution footer even when loading.
 */
export type StageLoadOscarDataProps = {
  terms: string[];
  term: string;
  setTerm: (next: string) => void;
  children: (props: { oscar: Oscar }) => React.ReactNode;
};

export function StageLoadOscarData({
  terms,
  term,
  setTerm,
  children,
}: StageLoadOscarDataProps): React.ReactElement {
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

export type StageExtractScheduleVersionProps = {
  terms: NonEmptyArray<string>;
  currentTerm: string;
  setTerm: (next: string) => void;
  termScheduleData: Immutable<TermScheduleData>;
  updateTermScheduleData: (
    applyDraft: (
      draft: Draft<TermScheduleData>
    ) => void | Immutable<TermScheduleData>
  ) => void;
  children: (props: {
    currentIndex: number;
    scheduleVersion: Immutable<ScheduleVersion>;
    // This function allows the schedule version to be edited in 1 of 2 ways:
    // 1. the draft parameter is mutated, and the function returns nothing/void
    // 2. the draft parameter is not mutated
    //    (it can still be used, just not mutated)
    //    and the function returns the new state to use.
    //    This is similar to a traditional setState callback
    updateScheduleVersion: (
      applyDraft: (
        draft: Draft<ScheduleVersion>
      ) => void | Immutable<ScheduleVersion>
    ) => void;
  }) => React.ReactNode;
};

/**
 * Handles extracting the schedule version from the parent tern schedule data,
 * ensuring that it is valid before rendering its children.
 */
export function StageExtractScheduleVersion({
  terms,
  currentTerm,
  setTerm,
  termScheduleData,
  updateTermScheduleData,
  children,
}: StageExtractScheduleVersionProps): React.ReactElement {
  const loadingState = useExtractSchedule(
    termScheduleData,
    updateTermScheduleData
  );

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeletonWithSwitchableTerms
        terms={terms}
        currentTerm={currentTerm}
        onChangeTerm={setTerm}
      >
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="current schedule version"
          />
        </SkeletonContent>
      </AppSkeletonWithSwitchableTerms>
    );
  }

  return <>{children({ ...loadingState.result })}</>;
}
