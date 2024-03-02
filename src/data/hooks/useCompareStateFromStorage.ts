import { useCallback } from 'react';
import useLocalStorageState from 'use-local-storage-state';

export const UI_STATE_LOCAL_STORAGE_KEY = 'ui-state';

type HookResult = {
  compare: boolean;
  pinned: string[];
  pinSelf: boolean;
  handleCompareSchedules: (
    newCompare: boolean | undefined,
    newPinned: string[] | undefined,
    newPinSelf: boolean | undefined
  ) => void;
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
export default function useCompareStateFromStorage(): HookResult {
  const [compare, setCompare] = useLocalStorageState<boolean>(
    'compare-panel-state-compareValue',
    {
      defaultValue: false,
      storageSync: false,
    }
  );
  const [pinned, setPinned] = useLocalStorageState<string[]>(
    'compare-panel-state-pinnedSchedules',
    {
      defaultValue: [],
      storageSync: false,
    }
  );
  const [pinSelf, setPinSelf] = useLocalStorageState<boolean>(
    'compare-panel-state-pinSelfValue',
    {
      defaultValue: true,
      storageSync: false,
    }
  );

  const handleCompareSchedules = useCallback(
    (
      newCompare?: boolean,
      newPinnedSchedules?: string[],
      newPinSelf?: boolean
    ) => {
      if (newCompare !== undefined) {
        setCompare(newCompare);
      }
      if (newPinnedSchedules !== undefined) {
        setPinned(newPinnedSchedules);
      }
      if (newPinSelf !== undefined) {
        setPinSelf(newPinSelf);
      }
    },
    [setCompare, setPinned, setPinSelf]
  );

  return {
    compare,
    pinned,
    pinSelf,
    handleCompareSchedules,
  };
}
