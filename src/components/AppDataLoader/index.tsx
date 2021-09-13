import produce, { Immutable, Draft, original, castDraft } from 'immer';
import React, { useCallback, useMemo } from 'react';

import {
  ScheduleContextValue,
  TermsContext,
  ScheduleContext,
} from '../../contexts';
import { Oscar } from '../../data/beans';
import { Schedule, defaultSchedule, ScheduleVersion } from '../../data/types';
import {
  StageLoadScheduleData,
  StageLoadTerms,
  StageExtractTermScheduleData,
  StageLoadOscarData,
  StageExtractScheduleVersion,
} from './stages';

export type DataLoaderProps = {
  children: React.ReactNode;
};

/**
 * Handles loading all relevant data and provide valid values
 * for the Terms & Term contexts before rendering its `children`.
 * Works by having a series of "stages" implemented as components,
 * where each stage doesn't render its children until its ready.
 * Until then, they won't run the function passed in to their `children` prop
 * and will instead show an intermediate loading state,
 * complete with an app "skeleton" that includes the footer/header.
 */
export default function DataLoader({
  children,
}: DataLoaderProps): React.ReactElement {
  return (
    <StageLoadScheduleData>
      {({ scheduleData, updateScheduleData, setTerm }): React.ReactElement => (
        <StageLoadTerms>
          {({ terms }): React.ReactElement => (
            <StageExtractTermScheduleData
              terms={terms}
              scheduleData={scheduleData}
              updateScheduleData={updateScheduleData}
            >
              {({
                currentTerm,
                termScheduleData,
                updateTermScheduleData,
              }): React.ReactElement => (
                <StageLoadOscarData
                  terms={terms}
                  term={currentTerm}
                  setTerm={setTerm}
                >
                  {({ oscar }): React.ReactElement => (
                    <StageExtractScheduleVersion
                      terms={terms}
                      currentTerm={currentTerm}
                      setTerm={setTerm}
                      termScheduleData={termScheduleData}
                      updateTermScheduleData={updateTermScheduleData}
                    >
                      {({
                        // currentIndex,
                        scheduleVersion,
                        updateScheduleVersion,
                      }): React.ReactElement => (
                        <ContextProvider
                          terms={terms}
                          term={currentTerm}
                          setTerm={setTerm}
                          oscar={oscar}
                          scheduleVersion={scheduleVersion}
                          updateScheduleVersion={updateScheduleVersion}
                        >
                          {children}
                        </ContextProvider>
                      )}
                    </StageExtractScheduleVersion>
                  )}
                </StageLoadOscarData>
              )}
            </StageExtractTermScheduleData>
          )}
        </StageLoadTerms>
      )}
    </StageLoadScheduleData>
  );
}

// Private sub-components

type ContextProviderProps = {
  terms: string[];
  term: string;
  setTerm: (next: string) => void;
  oscar: Oscar;
  scheduleVersion: Immutable<ScheduleVersion>;
  updateScheduleVersion: (
    applyDraft: (
      draft: Draft<ScheduleVersion>
    ) => void | Immutable<ScheduleVersion>
  ) => void;
  children: React.ReactNode;
};

/**
 * Handles making all loaded data available to the rest of the app
 * via the contexts `TermsContext` and `ScheduleContext`.
 * Additionally, memoizes the context values
 * as well as any derived values that go into them.
 */
function ContextProvider({
  terms,
  term,
  setTerm,
  oscar,
  scheduleVersion,
  updateScheduleVersion,
  children,
}: ContextProviderProps): React.ReactElement {
  // Create a `updateSchedule` function
  const updateSchedule = useCallback(
    (
      applyDraft: (draft: Draft<Schedule>) => void | Immutable<Schedule>
    ): void => {
      updateScheduleVersion((draft) => {
        draft.schedule = produce(draft.schedule, (subDraft) =>
          castDraft(applyDraft(subDraft))
        );
      });
    },
    [updateScheduleVersion]
  );

  // Create a `patchSchedule` function
  const patchSchedule = useCallback(
    (patch: Partial<Schedule>): void => {
      updateSchedule((draft) => ({
        ...(original(draft) ?? defaultSchedule),
        ...patch,
      }));
    },
    [updateSchedule]
  );

  // Memoize the context value so that it is stable
  const scheduleContextValue = useMemo<ScheduleContextValue>(
    () => [
      { term, oscar, ...castDraft(scheduleVersion.schedule) },
      { setTerm, patchSchedule, updateSchedule },
    ],
    [term, oscar, scheduleVersion, setTerm, patchSchedule, updateSchedule]
  );

  return (
    <TermsContext.Provider value={terms}>
      <ScheduleContext.Provider value={scheduleContextValue}>
        {children}
      </ScheduleContext.Provider>
    </TermsContext.Provider>
  );
}
