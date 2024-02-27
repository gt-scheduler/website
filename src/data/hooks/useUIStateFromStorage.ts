import { useCallback } from 'react';
import useLocalStorageState from 'use-local-storage-state';

export const UI_STATE_LOCAL_STORAGE_KEY = 'ui-state';

export interface UIState {
  currentTerm: string;
  versionStates: Record<string, VersionUIState>;
}

export const defaultUIState: UIState = {
  currentTerm: '',
  versionStates: {},
};

export interface VersionUIState {
  currentVersion: string;
}

type HookResult = {
  currentTerm: string;
  setTerm: (next: string) => void;
  currentVersion: string;
  setVersion: (next: string) => void;
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
  const [{ currentTerm, versionStates }, setUIState] = useLocalStorageState(
    UI_STATE_LOCAL_STORAGE_KEY,
    {
      defaultValue: defaultUIState,
      storageSync: false,
    }
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

  return {
    currentTerm,
    setTerm,
    currentVersion,
    setVersion,
  };
}
