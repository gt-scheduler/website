import produce, { Immutable, Draft, original, castDraft } from 'immer';
import React, { useCallback, useMemo } from 'react';

import {
  ScheduleContextValue,
  TermsContext,
  ScheduleContext,
} from '../../contexts';
import { Oscar } from '../../data/beans';
import useVersionActions from '../../data/hooks/useVersionActions';
import {
  Schedule,
  defaultSchedule,
  TermScheduleData,
  ScheduleVersion,
} from '../../data/types';
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
              }): React.ReactElement => {
                // From here down, we can pass
                // the `termsState` value to the `skeletonProps`
                // prop on each stage to allow the user to switch terms
                // even as the rest of the app is loading.
                const termsState = {
                  terms,
                  onChangeTerm: setTerm,
                  currentTerm,
                };
                return (
                  <StageLoadOscarData
                    skeletonProps={{ termsState }}
                    term={currentTerm}
                  >
                    {({ oscar }): React.ReactElement => (
                      <StageExtractScheduleVersion
                        skeletonProps={{ termsState }}
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
                            termScheduleData={termScheduleData}
                            updateTermScheduleData={updateTermScheduleData}
                          >
                            {children}
                          </ContextProvider>
                        )}
                      </StageExtractScheduleVersion>
                    )}
                  </StageLoadOscarData>
                );
              }}
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
  termScheduleData: Immutable<TermScheduleData>;
  updateTermScheduleData: (
    applyDraft: (
      draft: Draft<TermScheduleData>
    ) => void | Immutable<TermScheduleData>
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
  termScheduleData,
  updateTermScheduleData,
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

  // Derive the list of all version names
  const allVersionNames = useMemo<string[]>(
    () => termScheduleData.versions.map(({ name }) => name),
    [termScheduleData.versions]
  );

  // Get all version-related actions
  const { setCurrentVersion, addNewVersion, deleteVersion, renameVersion } =
    useVersionActions({ updateTermScheduleData });

  // Memoize the context value so that it is stable
  const { currentIndex: currentVersionIndex } = termScheduleData;
  const scheduleContextValue = useMemo<ScheduleContextValue>(
    () => [
      {
        term,
        oscar,
        currentVersionIndex,
        allVersionNames,
        ...castDraft(scheduleVersion.schedule),
      },
      {
        setTerm,
        patchSchedule,
        updateSchedule,
        setCurrentVersion,
        addNewVersion,
        deleteVersion,
        renameVersion,
      },
    ],
    [
      term,
      oscar,
      currentVersionIndex,
      allVersionNames,
      scheduleVersion.schedule,
      setTerm,
      patchSchedule,
      updateSchedule,
      setCurrentVersion,
      addNewVersion,
      deleteVersion,
      renameVersion,
    ]
  );

  return (
    <TermsContext.Provider value={terms}>
      <ScheduleContext.Provider value={scheduleContextValue}>
        {children}
      </ScheduleContext.Provider>
    </TermsContext.Provider>
  );
}
