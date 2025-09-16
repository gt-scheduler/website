import produce, { Immutable, Draft, original, castDraft } from 'immer';
import React, { useCallback, useMemo, useState } from 'react';

import {
  TermsContext,
  ScheduleContext,
  ScheduleContextValue,
  FriendContext,
  FriendContextValue,
} from '../../contexts';
import { AccountContext, AccountContextValue } from '../../contexts/account';
import { Oscar } from '../../data/beans';
import { COURSES } from '../../constants';
import useVersionActions from '../../data/hooks/useVersionActions';
import {
  Schedule,
  defaultSchedule,
  TermScheduleData,
  ScheduleVersion,
  ScheduleData,
  FriendTermData,
  FriendInfo,
  FriendScheduleData,
  FriendShareData,
} from '../../data/types';
import { lexicographicCompare } from '../../utils/misc';
import {
  StageLoadUIState,
  StageLoadTerms,
  StageEnsureValidTerm,
  StageLoadAccount,
  StageLoadRawFriendData,
  StageLoadRawScheduleDataHybrid,
  StageMigrateScheduleData,
  StageCreateScheduleDataProducer,
  StageExtractTermScheduleData,
  StageLoadOscarData,
  StageExtractScheduleVersion,
  StageSkeletonProps,
  StageCreateFriendDataProducer,
  StageExtractFriendTermData,
  StageLoadRawFriendScheduleDataFromFirebaseFunction,
  StageExtractFriendInfo,
} from './stages';
import { softError, ErrorWithFields } from '../../log';
import { Term } from '../../types';

export type DataLoaderProps = {
  children: React.ReactNode;
};

/**
 * Handles loading all relevant data and provide valid values
 * for the Terms, Term, and Account contexts before rendering its `children`.
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
                  <StageLoadAccount skeletonProps={{ termsState }}>
                    {({ accountState }): React.ReactElement => (
                      <GroupLoadScheduleData
                        accountState={accountState}
                        skeletonProps={{ termsState, accountState }}
                      >
                        {({
                          scheduleData,
                          updateScheduleData,
                        }): React.ReactElement => (
                          <StageExtractTermScheduleData
                            skeletonProps={{ termsState, accountState }}
                            currentTerm={currentTerm}
                            scheduleData={scheduleData}
                            updateScheduleData={updateScheduleData}
                          >
                            {({
                              termScheduleData,
                              updateTermScheduleData,
                            }): React.ReactElement => (
                              <GroupLoadFriendScheduleData
                                skeletonProps={{ termsState, accountState }}
                                accountState={accountState}
                                currentTerm={currentTerm}
                              >
                                {({
                                  friendScheduleData,
                                  updateFriendTermData,
                                  updateFriendInfo,
                                }): React.ReactElement => (
                                  <StageLoadOscarData
                                    skeletonProps={{ termsState, accountState }}
                                    term={currentTerm}
                                  >
                                    {({ oscar }): React.ReactElement => (
                                      <StageExtractScheduleVersion
                                        skeletonProps={{
                                          termsState,
                                          accountState,
                                        }}
                                        currentVersionRaw={currentVersionRaw}
                                        setVersion={setVersion}
                                        termScheduleData={termScheduleData}
                                        updateTermScheduleData={
                                          updateTermScheduleData
                                        }
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
                                            accountState={accountState}
                                            friendScheduleData={
                                              friendScheduleData
                                            }
                                            updateFriendTermData={
                                              updateFriendTermData
                                            }
                                            updateFriendInfo={updateFriendInfo}
                                          >
                                            {children}
                                          </ContextProvider>
                                        )}
                                      </StageExtractScheduleVersion>
                                    )}
                                  </StageLoadOscarData>
                                )}
                              </GroupLoadFriendScheduleData>
                            )}
                          </StageExtractTermScheduleData>
                        )}
                      </GroupLoadScheduleData>
                    )}
                  </StageLoadAccount>
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
  accountState: AccountContextValue;
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
  accountState,
  children,
}: GroupLoadScheduleDataProps): React.ReactElement {
  return (
    <StageLoadRawScheduleDataHybrid
      skeletonProps={skeletonProps}
      accountState={accountState}
    >
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
    </StageLoadRawScheduleDataHybrid>
  );
}

type GroupLoadFriendScheduleDataProps = {
  skeletonProps?: StageSkeletonProps;
  accountState: AccountContextValue;
  currentTerm: string;
  children: (props: {
    friendScheduleData: Immutable<FriendScheduleData>;
    updateFriendTermData: (
      applyDraft: (
        draft: Draft<FriendTermData>
      ) => void | Immutable<FriendTermData>
    ) => void;
    updateFriendInfo: (
      applyDraft: (draft: Draft<FriendInfo>) => void | Immutable<FriendInfo>
    ) => void;
  }) => React.ReactNode;
};

function GroupLoadFriendScheduleData({
  skeletonProps,
  accountState,
  currentTerm,
  children,
}: GroupLoadFriendScheduleDataProps): React.ReactElement {
  return (
    <StageLoadRawFriendData
      skeletonProps={skeletonProps}
      accountState={accountState}
      currentTerm={currentTerm}
    >
      {({ rawFriendData, setFriendData }): React.ReactElement => (
        <StageCreateFriendDataProducer setFriendData={setFriendData}>
          {({ updateFriendData }): React.ReactElement => (
            <StageExtractFriendTermData
              skeletonProps={skeletonProps}
              accountState={accountState}
              currentTerm={currentTerm}
              rawFriendData={rawFriendData}
              updateFriendData={updateFriendData}
            >
              {({
                termFriendData,
                updateFriendTermData,
              }): React.ReactElement => (
                <StageLoadRawFriendScheduleDataFromFirebaseFunction
                  skeletonProps={skeletonProps}
                  accountState={accountState}
                  currentTerm={currentTerm}
                  termFriendData={termFriendData}
                >
                  {({ rawFriendScheduleData }): React.ReactElement => (
                    <StageExtractFriendInfo
                      skeletonProps={skeletonProps}
                      accountState={accountState}
                      rawFriendScheduleData={rawFriendScheduleData}
                      friendInfo={rawFriendData.info}
                      updateFriendData={updateFriendData}
                    >
                      {({
                        friendScheduleData,
                        updateFriendInfo,
                      }): React.ReactElement => (
                        <>
                          {children({
                            friendScheduleData,
                            updateFriendTermData,
                            updateFriendInfo,
                          })}
                        </>
                      )}
                    </StageExtractFriendInfo>
                  )}
                </StageLoadRawFriendScheduleDataFromFirebaseFunction>
              )}
            </StageExtractFriendTermData>
          )}
        </StageCreateFriendDataProducer>
      )}
    </StageLoadRawFriendData>
  );
}

type ContextProviderProps = {
  terms: Term[];
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
  accountState: AccountContextValue;
  friendScheduleData: Immutable<FriendScheduleData>;
  updateFriendTermData: (
    applyDraft: (
      draft: Draft<FriendTermData>
    ) => void | Immutable<FriendTermData>
  ) => void;
  updateFriendInfo: (
    applyDraft: (draft: Draft<FriendInfo>) => void | Immutable<FriendInfo>
  ) => void;
  children: React.ReactNode;
};

/**
 * Handles making all loaded data available to the rest of the app
 * via the contexts `TermsContext`, `ScheduleContext`, and `AccountContext`.
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
  accountState,
  friendScheduleData,
  updateFriendTermData,
  updateFriendInfo,
  children,
}: ContextProviderProps): React.ReactElement {
  const [courseContainerTab, setCourseContainerTab] = useState<number>(COURSES);

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

  const allFriends = useMemo<
    Record<string, Record<string, FriendShareData>>
  >(() => {
    const f = {} as Record<string, Record<string, FriendShareData>>;
    Object.entries(termScheduleData.versions).forEach(
      ([versionId, { friends }]) => {
        f[versionId] = friends;
      }
    );
    return f;
  }, [termScheduleData.versions]);

  // Get all version-related actions
  const {
    addNewVersion,
    deleteVersion,
    renameVersion,
    cloneVersion,
    deleteFriendRecord,
  } = useVersionActions({
    updateTermScheduleData,
    setVersion,
    currentVersion,
  });

  // Create a rename friend function.
  const renameFriend = useCallback(
    (id: string, newName: string): void => {
      updateFriendInfo((draft) => {
        const existingDraft = draft[id];
        if (existingDraft === undefined) {
          softError(
            new ErrorWithFields({
              message:
                "renameFriend called with current friend id that doesn't exist; ignoring",
              fields: {
                allFriendNames: Object.entries(draft).map(
                  ([friendId, { name }]) => ({
                    id: friendId,
                    name,
                  })
                ),
                id,
                friendCount: Object.keys(draft).length,
                newName,
              },
            })
          );
          return;
        }

        existingDraft.name = newName;
      });
    },
    [updateFriendInfo]
  );

  // Memoize the context values so that they are stable
  const scheduleContextValue = useMemo<ScheduleContextValue>(
    () => [
      {
        term: currentTerm,
        oscar,
        currentVersion,
        allVersionNames,
        allFriends,
        currentFriends: scheduleVersion.friends ?? {},
        ...castDraft(scheduleVersion.schedule),
        versions: termScheduleData.versions,
        courseContainerTab,
      },
      {
        setTerm,
        patchSchedule,
        updateSchedule,
        setCurrentVersion: setVersion,
        addNewVersion,
        deleteVersion,
        deleteFriendRecord,
        renameVersion,
        cloneVersion,
        setCourseContainerTab,
      },
    ],
    [
      currentTerm,
      oscar,
      currentVersion,
      allVersionNames,
      allFriends,
      scheduleVersion.friends,
      scheduleVersion.schedule,
      setTerm,
      patchSchedule,
      updateSchedule,
      setVersion,
      addNewVersion,
      deleteFriendRecord,
      deleteVersion,
      renameVersion,
      cloneVersion,
      termScheduleData.versions,
      courseContainerTab,
      setCourseContainerTab,
    ]
  );

  const friendContextValue = useMemo<FriendContextValue>(
    () => [
      {
        friends: friendScheduleData,
      },
      {
        renameFriend,
        updateFriendTermData,
        updateFriendInfo,
      },
    ],
    [friendScheduleData, renameFriend, updateFriendTermData, updateFriendInfo]
  );

  return (
    <TermsContext.Provider value={terms}>
      <ScheduleContext.Provider value={scheduleContextValue}>
        <AccountContext.Provider value={accountState}>
          <FriendContext.Provider value={friendContextValue}>
            {children}
          </FriendContext.Provider>
        </AccountContext.Provider>
      </ScheduleContext.Provider>
    </TermsContext.Provider>
  );
}
