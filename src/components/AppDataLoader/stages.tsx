import React, { useMemo } from 'react';
import { Immutable, Draft, castDraft, castImmutable } from 'immer';

import { Oscar } from '../../data/beans';
import useDownloadOscarData from '../../data/hooks/useDownloadOscarData';
import useDownloadTerms from '../../data/hooks/useDownloadTerms';
import { NonEmptyArray, Term } from '../../types';
import LoadingDisplay from '../LoadingDisplay';
import { SkeletonContent, AppSkeleton, AppSkeletonProps } from '../App/content';
import {
  AnyScheduleData,
  defaultFriendData,
  FriendData,
  FriendTermData,
  FriendIds,
  FriendInfo,
  ScheduleData,
  ScheduleVersion,
  TermScheduleData,
  RawFriendScheduleData,
  FriendScheduleData,
} from '../../data/types';
import useRawScheduleDataFromStorage from '../../data/hooks/useRawScheduleDataFromStorage';
import useExtractSchedule from '../../data/hooks/useExtractScheduleVersion';
import useExtractTermScheduleData from '../../data/hooks/useExtractTermScheduleData';
import useEnsureValidTerm from '../../data/hooks/useEnsureValidTerm';
import useScheduleDataProducer from '../../data/hooks/useScheduleDataProducer';
import useMigrateScheduleData from '../../data/hooks/useMigrateScheduleData';
import useUIStateFromStorage from '../../data/hooks/useUIStateFromStorage';
import { AccountContextValue, SignedIn } from '../../contexts/account';
import useFirebaseAuth from '../../data/hooks/useFirebaseAuth';
import useRawScheduleDataFromFirebase from '../../data/hooks/useRawScheduleDataFromFirebase';
import useRawFriendDataFromFirebase from '../../data/hooks/useRawFriendDataFromFirebase';
import useFriendDataProducer from '../../data/hooks/useFriendDataProducer';
import useExtractFriendTermData from '../../data/hooks/useExtractFriendTermData';
import useRawFriendScheduleDataFromFirebaseFunction from '../../data/hooks/useRawFriendScheduleDataFromFirebaseFunction';
import useExtractFriendInfo from '../../data/hooks/useExtractFriendInfo';

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
// depends on fetching the list of terms from the crawler's index,
// so having them be two separate stages naturally encodes this dependency.
// It also lets us stop rendering the app when data is still loading,
// and instead show a partially interactive "skeleton".

// Each Stage includes this prop,
// which passes through props
// to the underlying `<AppSkeleton>` component.
// It can be used to show partial interactivity
// while the app is loading
// (See `<AppSkeleton>` for more info on the possible states).
export type StageSkeletonProps = Omit<AppSkeletonProps, 'children'>;

export type StageLoadUIStateProps = {
  children: (props: {
    currentTerm: string;
    setTerm: (next: string) => void;
    currentVersion: string;
    setVersion: (next: string) => void;
  }) => React.ReactNode;
};

/**
 * Loads in the UI State (current term,
 * current schedule version for the current term)
 * from local storage.
 * Unlike the local storage version of the app data,
 * this **does not** sync between tabs.
 * This is deliberate, as it allows opening up multiple tabs
 * with different schedules if desired,
 * but still have the app resume to the last viewed schedule when opened again.
 */
export function StageLoadUIState({
  children,
}: StageLoadUIStateProps): React.ReactElement {
  const uiState = useUIStateFromStorage();
  return <>{children({ ...uiState })}</>;
}

export type StageEnsureValidTermProps = {
  skeletonProps?: StageSkeletonProps;
  terms: NonEmptyArray<Term>;
  currentTermRaw: string;
  setTerm: (next: string) => void;
  children: (props: { currentTerm: string }) => React.ReactNode;
};

/**
 * Ensures that there is a valid current term selected.
 * If the current term isn't valid (i.e. empty or not in the `terms` array),
 * then it is set to the most recent term (which is the first item in `terms`).
 */
export function StageEnsureValidTerm({
  skeletonProps,
  terms,
  currentTermRaw,
  setTerm,
  children,
}: StageEnsureValidTermProps): React.ReactElement {
  const loadingState = useEnsureValidTerm({ terms, currentTermRaw, setTerm });

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay state={loadingState} name="current term" />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ ...loadingState.result })}</>;
}

export type StageLoadRawScheduleDataFromStorageProps = {
  skeletonProps?: StageSkeletonProps;
  children: (props: {
    rawScheduleData: Immutable<AnyScheduleData> | null;
    setRawScheduleData: (
      next:
        | ((current: AnyScheduleData | null) => AnyScheduleData | null)
        | AnyScheduleData
    ) => void;
  }) => React.ReactNode;
};

/**
 * Handles loading the raw local schedule data from local storage.
 * Renders a disabled header & attribution footer even when loading.
 */
export function StageLoadRawScheduleDataFromStorage({
  skeletonProps,
  children,
}: StageLoadRawScheduleDataFromStorageProps): React.ReactElement {
  const loadingState = useRawScheduleDataFromStorage();

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay state={loadingState} name="local schedule data" />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ ...loadingState.result })}</>;
}

export type StageMigrateScheduleDataProps = {
  skeletonProps?: StageSkeletonProps;
  rawScheduleData: Immutable<AnyScheduleData> | null;
  setRawScheduleData: (
    next:
      | ((current: AnyScheduleData | null) => AnyScheduleData | null)
      | AnyScheduleData
  ) => void;
  children: (props: {
    scheduleData: Immutable<ScheduleData>;
    setScheduleData: (
      next: ((current: ScheduleData) => ScheduleData) | ScheduleData
    ) => void;
  }) => React.ReactNode;
};

/**
 * Handles migrating the raw schedule data as needed to the latest version.
 */
export function StageMigrateScheduleData({
  skeletonProps,
  rawScheduleData,
  setRawScheduleData,
  children,
}: StageMigrateScheduleDataProps): React.ReactElement {
  const loadingState = useMigrateScheduleData({
    rawScheduleData: castDraft(rawScheduleData),
    setRawScheduleData,
  });

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="schema migrations to schedule data"
          />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ ...loadingState.result })}</>;
}

export type StageLoadRawScheduleDataHybridProps = {
  skeletonProps?: StageSkeletonProps;
  accountState: AccountContextValue;
  children: (props: {
    rawScheduleData: Immutable<AnyScheduleData> | null;
    setRawScheduleData: (
      next:
        | ((current: AnyScheduleData | null) => AnyScheduleData | null)
        | AnyScheduleData
    ) => void;
  }) => React.ReactNode;
};

/**
 * Handles loading the schedule data from either Firebase or local storage
 * depending on the current account state.
 */
export function StageLoadRawScheduleDataHybrid({
  skeletonProps,
  accountState,
  children,
}: StageLoadRawScheduleDataHybridProps): React.ReactElement {
  if (accountState.type === 'signedIn') {
    return (
      <StageLoadRawScheduleDataFromFirebase
        skeletonProps={skeletonProps}
        accountState={accountState}
      >
        {children}
      </StageLoadRawScheduleDataFromFirebase>
    );
  }

  return (
    <StageLoadRawScheduleDataFromStorage skeletonProps={skeletonProps}>
      {children}
    </StageLoadRawScheduleDataFromStorage>
  );
}

export type StageLoadRawScheduleDataFromFirebaseProps = {
  skeletonProps?: StageSkeletonProps;
  accountState: SignedIn;
  children: (props: {
    rawScheduleData: Immutable<AnyScheduleData> | null;
    setRawScheduleData: (
      next:
        | ((current: AnyScheduleData | null) => AnyScheduleData | null)
        | AnyScheduleData
    ) => void;
  }) => React.ReactNode;
};

/**
 * Handles loading the schedule data from Firebase,
 * handling uploading initial data if the user has no document.
 * Renders a disabled header & attribution footer even when loading.
 */
export function StageLoadRawScheduleDataFromFirebase({
  skeletonProps,
  accountState,
  children,
}: StageLoadRawScheduleDataFromFirebaseProps): React.ReactElement {
  const loadingState = useRawScheduleDataFromFirebase(accountState);
  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="schedule data from the cloud"
          />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ ...loadingState.result })}</>;
}

export type StageLoadAccountProps = {
  skeletonProps?: StageSkeletonProps;
  children: (props: { accountState: AccountContextValue }) => React.ReactNode;
};

/**
 * Handles loading the user login state
 * (account state from Firebase Authentication).
 * Renders a disabled header & attribution footer even when loading.
 */
export function StageLoadAccount({
  skeletonProps,
  children,
}: StageLoadAccountProps): React.ReactElement {
  const accountState = useFirebaseAuth();

  if (accountState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay state={accountState} name="account" />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ accountState: accountState.result })}</>;
}

export type StageCreateScheduleDataProducerProps = {
  setScheduleData: (
    next: ((current: ScheduleData) => ScheduleData) | ScheduleData
  ) => void;
  children: (props: {
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
  }) => React.ReactNode;
};

/**
 * Creates the `updateScheduleData` Immer producer
 * from the `setScheduleData` setter.
 * The producer is used to more easily modify state.
 */
export function StageCreateScheduleDataProducer({
  setScheduleData,
  children,
}: StageCreateScheduleDataProducerProps): React.ReactElement {
  const { updateScheduleData } = useScheduleDataProducer({ setScheduleData });
  return <>{children({ updateScheduleData })}</>;
}

export type StageLoadTermsProps = {
  skeletonProps?: StageSkeletonProps;
  children: (props: { terms: NonEmptyArray<Term> }) => React.ReactNode;
};

/**
 * Handles loading the list of terms from the crawler's index upon first mount,
 * showing loading and error states as needed.
 * Renders a disabled header & attribution footer even when loading.
 */
export function StageLoadTerms({
  skeletonProps,
  children,
}: StageLoadTermsProps): React.ReactElement {
  const loadingState = useDownloadTerms();

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay state={loadingState} name="list of current terms" />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ terms: loadingState.result })}</>;
}

export type StageExtractTermScheduleDataProps = {
  skeletonProps?: StageSkeletonProps;
  currentTerm: string;
  scheduleData: Immutable<ScheduleData>;
  updateScheduleData: (
    applyDraft: (draft: Draft<ScheduleData>) => void | Immutable<ScheduleData>
  ) => void;
  children: (props: {
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
  skeletonProps,
  currentTerm,
  scheduleData,
  updateScheduleData,
  children,
}: StageExtractTermScheduleDataProps): React.ReactElement {
  const loadingState = useExtractTermScheduleData({
    currentTerm,
    scheduleData,
    updateScheduleData,
  });

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="schedule data for the current term"
          />
        </SkeletonContent>
      </AppSkeleton>
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
  skeletonProps?: StageSkeletonProps;
  term: string;
  children: (props: { oscar: Oscar }) => React.ReactNode;
};

export function StageLoadOscarData({
  skeletonProps,
  term,
  children,
}: StageLoadOscarDataProps): React.ReactElement {
  const loadingState = useDownloadOscarData(term);

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="Oscar course data for the current term"
          />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ oscar: loadingState.result })}</>;
}

export type StageExtractScheduleVersionProps = {
  skeletonProps?: StageSkeletonProps;
  currentVersionRaw: string;
  setVersion: (next: string) => void;
  termScheduleData: Immutable<TermScheduleData>;
  updateTermScheduleData: (
    applyDraft: (
      draft: Draft<TermScheduleData>
    ) => void | Immutable<TermScheduleData>
  ) => void;
  children: (props: {
    currentVersion: string;
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
  skeletonProps,
  currentVersionRaw,
  setVersion,
  termScheduleData,
  updateTermScheduleData,
  children,
}: StageExtractScheduleVersionProps): React.ReactElement {
  const loadingState = useExtractSchedule({
    termScheduleData,
    updateTermScheduleData,
    currentVersionRaw,
    setVersion,
  });

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="current schedule version"
          />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ ...loadingState.result })}</>;
}

export type StageLoadRawFriendDataProps = {
  skeletonProps?: StageSkeletonProps;
  accountState: AccountContextValue;
  currentTerm: string;
  children: (props: {
    rawFriendData: Immutable<FriendData>;
    setFriendData: (
      next: ((current: FriendData | null) => FriendData | null) | FriendData
    ) => void;
  }) => React.ReactNode;
};

export function StageLoadRawFriendData({
  skeletonProps,
  accountState,
  currentTerm,
  children,
}: StageLoadRawFriendDataProps): React.ReactElement {
  const friendDataSignedOut = useMemo(() => {
    const friendData = castDraft({ ...defaultFriendData });
    friendData.terms[currentTerm] = { accessibleSchedules: {} };
    return castImmutable(friendData);
  }, [currentTerm]);

  if (accountState.type === 'signedOut') {
    return (
      <>
        {children({
          rawFriendData: friendDataSignedOut,
          setFriendData: () => {
            /* empty */
          },
        })}
      </>
    );
  }

  return StageLoadRawFriendDataFromFirebase({
    skeletonProps,
    accountState,
    children,
  });
}

export type StageLoadRawFriendDataFromFirebaseProps = {
  skeletonProps?: StageSkeletonProps;
  accountState: SignedIn;
  children: (props: {
    rawFriendData: Immutable<FriendData>;
    setFriendData: (
      next: ((current: FriendData | null) => FriendData | null) | FriendData
    ) => void;
  }) => React.ReactNode;
};

export function StageLoadRawFriendDataFromFirebase({
  skeletonProps,
  accountState,
  children,
}: StageLoadRawFriendDataFromFirebaseProps): React.ReactElement {
  const loadingState = useRawFriendDataFromFirebase(accountState);

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps}>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="friend data from the cloud"
          />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ ...loadingState.result })}</>;
}

export type StageCreateFriendDataProducerProps = {
  setFriendData: (
    next: ((current: FriendData | null) => FriendData | null) | FriendData
  ) => void;
  children: (props: {
    updateFriendData: (
      applyDraft: (draft: Draft<FriendData>) => void | Immutable<FriendData>
    ) => void;
  }) => React.ReactNode;
};

export function StageCreateFriendDataProducer({
  setFriendData,
  children,
}: StageCreateFriendDataProducerProps): React.ReactElement {
  const { updateFriendData } = useFriendDataProducer({ setFriendData });
  return <>{children({ updateFriendData })}</>;
}

export type StageExtractFriendTermDataProps = {
  skeletonProps?: StageSkeletonProps;
  accountState: AccountContextValue;
  currentTerm: string;
  rawFriendData: Immutable<FriendData>;
  updateFriendData: (
    applyDraft: (draft: Draft<FriendData>) => void | Immutable<FriendData>
  ) => void;
  children: (props: {
    termFriendData: Immutable<FriendIds>;
    updateFriendTermData: (
      applyDraft: (
        draft: Draft<FriendTermData>
      ) => void | Immutable<FriendTermData>
    ) => void;
  }) => React.ReactNode;
};

export function StageExtractFriendTermData({
  skeletonProps,
  accountState,
  currentTerm,
  rawFriendData,
  updateFriendData,
  children,
}: StageExtractFriendTermDataProps): React.ReactElement {
  const loadingState = useExtractFriendTermData({
    currentTerm,
    rawFriendData,
    updateFriendData,
  });

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps} accountState={accountState}>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="extract friend data for current term"
          />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return <>{children({ ...loadingState.result })}</>;
}

export type StageLoadRawFriendScheduleDataFromFirebaseFunctionProps = {
  skeletonProps?: StageSkeletonProps;
  accountState: AccountContextValue;
  currentTerm: string;
  termFriendData: Immutable<FriendIds>;
  children: (props: {
    rawFriendScheduleData: RawFriendScheduleData;
  }) => React.ReactNode;
};

export function StageLoadRawFriendScheduleDataFromFirebaseFunction({
  skeletonProps,
  accountState,
  currentTerm,
  termFriendData,
  children,
}: // eslint-disable-next-line max-len
StageLoadRawFriendScheduleDataFromFirebaseFunctionProps): React.ReactElement {
  const loadingState = useRawFriendScheduleDataFromFirebaseFunction({
    currentTerm,
    termFriendData,
  });

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps} accountState={accountState}>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="fetch friend schedules for current term"
          />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return (
    <>
      {children({
        rawFriendScheduleData: { ...loadingState.result.friendScheduleData },
      })}
    </>
  );
}

export type StageExtractFriendInfo = {
  skeletonProps?: StageSkeletonProps;
  accountState: AccountContextValue;
  rawFriendScheduleData: RawFriendScheduleData;
  friendInfo: Immutable<FriendInfo>;
  updateFriendData: (
    applyDraft: (draft: Draft<FriendData>) => void | Immutable<FriendData>
  ) => void;
  children: (props: {
    friendScheduleData: Immutable<FriendScheduleData>;
    updateFriendInfo: (
      applyDraft: (draft: Draft<FriendInfo>) => void | Immutable<FriendInfo>
    ) => void;
  }) => React.ReactNode;
};

export function StageExtractFriendInfo({
  skeletonProps,
  accountState,
  rawFriendScheduleData,
  friendInfo,
  updateFriendData,
  children,
}: StageExtractFriendInfo): React.ReactElement {
  const loadingState = useExtractFriendInfo({
    rawFriendScheduleData,
    friendInfo,
    updateFriendData,
  });

  if (loadingState.type !== 'loaded') {
    return (
      <AppSkeleton {...skeletonProps} accountState={accountState}>
        <SkeletonContent>
          <LoadingDisplay
            state={loadingState}
            name="extract friend info for current term"
          />
        </SkeletonContent>
      </AppSkeleton>
    );
  }

  return (
    <>
      {children({
        ...loadingState.result,
      })}
    </>
  );
}
