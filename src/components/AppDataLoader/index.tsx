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
  ScheduleData,
} from '../../data/types';
import { lexicographicCompare } from '../../utils/misc';
import {
  StageLoadUIState,
  StageLoadRawScheduleDataFromStorage,
  StageMigrateScheduleData,
  StageCreateScheduleDataProducer,
  StageLoadTerms,
  StageEnsureValidTerm,
  StageExtractTermScheduleData,
  StageLoadOscarData,
  StageExtractScheduleVersion,
  StageSkeletonProps,
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
    <StageLoadUIState>
      {({
        // The values gotten from `StageLoadUIState` are "raw"--
        // they may not point to valid terms/versions.
        // As such, we use the two `StageExtract...` components
        // to maintain the invariant that there are valid terms/versions,
        // and the output of those stages are the "non-raw" versions
        // of `currentTermRaw` and `currentVersionRaw`.
        currentTerm: currentTermRaw,
        setTerm,
        currentVersion: currentVersionRaw,
        setVersion,
      }): React.ReactElement => (
        <StageLoadTerms>
          {({ terms }): React.ReactElement => (
            <StageEnsureValidTerm
              terms={terms}
              setTerm={setTerm}
              currentTermRaw={currentTermRaw}
            >
              {({ currentTerm }): React.ReactElement => {
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
                  <GroupLoadScheduleData skeletonProps={{ termsState }}>
                    {({
                      scheduleData,
                      updateScheduleData,
                    }): React.ReactElement => (
                      <StageExtractTermScheduleData
                        skeletonProps={{ termsState }}
                        currentTerm={currentTerm}
                        scheduleData={scheduleData}
                        updateScheduleData={updateScheduleData}
                      >
                        {({
                          termScheduleData,
                          updateTermScheduleData,
                        }): React.ReactElement => (
                          <StageLoadOscarData
                            skeletonProps={{ termsState }}
                            term={currentTerm}
                          >
                            {({ oscar }): React.ReactElement => (
                              <StageExtractScheduleVersion
                                skeletonProps={{ termsState }}
                                currentVersionRaw={currentVersionRaw}
                                setVersion={setVersion}
                                termScheduleData={termScheduleData}
                                updateTermScheduleData={updateTermScheduleData}
                              >
                                {({
                                  currentVersion,
                                  scheduleVersion,
                                  updateScheduleVersion,
                                }): React.ReactElement => (
                                  <ContextProvider
                                    terms={terms}
                                    currentTerm={currentTerm}
                                    setTerm={setTerm}
                                    currentVersion={currentVersion}
                                    setVersion={setVersion}
                                    oscar={oscar}
                                    scheduleVersion={scheduleVersion}
                                    updateScheduleVersion={
                                      updateScheduleVersion
                                    }
                                    termScheduleData={termScheduleData}
                                    updateTermScheduleData={
                                      updateTermScheduleData
                                    }
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
                  </GroupLoadScheduleData>
                );
              }}
            </StageEnsureValidTerm>
          )}
        </StageLoadTerms>
      )}
    </StageLoadUIState>
  );
}

// Private sub-components

type GroupLoadScheduleDataProps = {
  skeletonProps?: StageSkeletonProps;
  children: (props: {
    scheduleData: Immutable<ScheduleData>;
    updateScheduleData: (
      applyDraft: (draft: Draft<ScheduleData>) => void | Immutable<ScheduleData>
    ) => void;
  }) => React.ReactNode;
};

/**
 * Groups together stages related to loading schedule data
 * and migrating it as needed.
 */
function GroupLoadScheduleData({
  skeletonProps,
  children,
}: GroupLoadScheduleDataProps): React.ReactElement {
  return (
    <StageLoadRawScheduleDataFromStorage skeletonProps={skeletonProps}>
      {({ rawScheduleData, setRawScheduleData }): React.ReactElement => (
        <StageMigrateScheduleData
          skeletonProps={skeletonProps}
          rawScheduleData={rawScheduleData}
          setRawScheduleData={setRawScheduleData}
        >
          {({ scheduleData, setScheduleData }): React.ReactElement => (
            <StageCreateScheduleDataProducer setScheduleData={setScheduleData}>
              {({ updateScheduleData }): React.ReactElement => (
                <>{children({ scheduleData, updateScheduleData })}</>
              )}
            </StageCreateScheduleDataProducer>
          )}
        </StageMigrateScheduleData>
      )}
    </StageLoadRawScheduleDataFromStorage>
  );
}

type ContextProviderProps = {
  terms: string[];
  currentTerm: string;
  setTerm: (next: string) => void;
  currentVersion: string;
  setVersion: (next: string) => void;
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
 * Additionally, this function memoizes the context values
 * as well as any derived values that go into them.
 */
function ContextProvider({
  terms,
  currentTerm,
  setTerm,
  currentVersion,
  setVersion,
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

  // Derive the list of all version names (and IDs)
  // in the order of their `createdAt` field.
  const allVersionNames = useMemo<{ id: string; name: string }[]>(() => {
    const versions = Object.entries(termScheduleData.versions).map(
      ([versionId, { name }]) => ({ id: versionId, name })
    );
    versions.sort((a, b) => {
      const createdAtA = termScheduleData.versions[a.id]?.createdAt ?? '';
      const createdAtB = termScheduleData.versions[b.id]?.createdAt ?? '';
      return lexicographicCompare(createdAtA, createdAtB);
    });
    return versions;
  }, [termScheduleData.versions]);

  // Get all version-related actions
  const { addNewVersion, deleteVersion, renameVersion } = useVersionActions({
    updateTermScheduleData,
    setVersion,
    currentVersion,
  });

  // Memoize the context values so that they are stable
  const scheduleContextValue = useMemo<ScheduleContextValue>(
    () => [
      {
        term: currentTerm,
        oscar,
        currentVersion,
        allVersionNames,
        ...castDraft(scheduleVersion.schedule),
      },
      {
        setTerm,
        patchSchedule,
        updateSchedule,
        setCurrentVersion: setVersion,
        addNewVersion,
        deleteVersion,
        renameVersion,
      },
    ],
    [
      currentTerm,
      oscar,
      currentVersion,
      allVersionNames,
      scheduleVersion.schedule,
      setTerm,
      patchSchedule,
      updateSchedule,
      setVersion,
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
