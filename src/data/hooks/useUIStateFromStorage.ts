import { useCallback } from 'react';

import useLocalStorageNoSync from '../../hooks/useLocalStorageNoSync';

export const UI_STATE_LOCAL_STORAGE_KEY = 'ui-state';

export interface UIState {
  currentTerm: string;
  versionStates: Record<string, VersionUIState>;
  currentCompare: boolean
}

export const defaultUIState: UIState = {
  currentTerm: '',
  versionStates: {},
  currentCompare: false
};

export interface VersionUIState {
  currentVersion: string;
}

export interface CompareState {
  currentCompare: boolean;
}

type HookResult = {
  currentTerm: string;
  setTerm: (next: string) => void;
  currentVersion: string;
  setVersion: (next: string) => void;
  currentCompare: boolean;
  setCompare: (next: boolean) => void;
};

/**
 * Gets the current UI state from local storage.
 * Do not call this function in a non-root component;
 * it should only be called once in a root component (i.e. <App>).
 * Moreover, unlike the local storage version of the app data,
 * this **does not** sync between tabs.
 * This is deliberate, as it allows opening up multiple tabs
 * with different schedules if desired,
 * but still have the app resume to the last viewed schedule when opened again.
 */
export default function useUIStateFromStorage(): HookResult {
  const [{ currentTerm, versionStates, currentCompare }, setUIState] = useLocalStorageNoSync(
    UI_STATE_LOCAL_STORAGE_KEY,
    defaultUIState
  );

  const setTerm = useCallback(
    (next: string) => {
      setUIState((current) => {
        return {
          ...current,
          currentTerm: next,
        };
      });
    },
    [setUIState]
  );

  const currentVersion = versionStates[currentTerm]?.currentVersion ?? '';
  const setVersion = useCallback(
    (next: string) => {
      setUIState((current) => {
        return {
          ...current,
          versionStates: {
            ...current.versionStates,
            [current.currentTerm]: {
              currentVersion: next,
            },
          },
        };
      });
    },
    [setUIState]
  );

  const setCompare = useCallback(
    (next: boolean) => {
      setUIState((current) => {
        return {
          ...current,
          currentCompare: next,
        };
      });
    },
    [setUIState]
  );

  return {
    currentTerm,
    setTerm,
    currentVersion,
    setVersion,
    currentCompare,
    setCompare
  };
}
