import { useCallback } from 'react';
import useLocalStorageState from 'use-local-storage-state';

type HookResult = {
  compare: boolean;
  pinned: string[];
  pinSelf: boolean;
  expanded: boolean;
  setCompareState: (
    newCompare: boolean | undefined,
    newPinned: string[] | undefined,
    newPinSelf: boolean | undefined,
    newExpanded: boolean | undefined
  ) => void;
};

type Props = {
  compareDefault?: boolean;
  pinDefault?: string[];
  pinSelfDefault?: boolean;
  expandedDefault?: boolean;
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
export default function useCompareStateFromStorage({
  compareDefault,
  pinDefault,
  pinSelfDefault,
  expandedDefault,
}: Props): HookResult {
  const [compare, setCompare] = useLocalStorageState<boolean>(
    'compare-panel-state-compareValue',
    {
      defaultValue: compareDefault ?? false,
      storageSync: false,
    }
  );
  const [pinned, setPinned] = useLocalStorageState<string[]>(
    'compare-panel-state-pinnedSchedules',
    {
      defaultValue: pinDefault ?? [],
      storageSync: false,
    }
  );
  const [pinSelf, setPinSelf] = useLocalStorageState<boolean>(
    'compare-panel-state-pinSelfValue',
    {
      defaultValue: pinSelfDefault ?? true,
      storageSync: false,
    }
  );
  const [expanded, setExpanded] = useLocalStorageState<boolean>(
    'compare-panel-state-expandedValue',
    {
      defaultValue: expandedDefault ?? true,
      storageSync: false,
    }
  );

  const setCompareState = useCallback(
    (
      newCompare?: boolean,
      newPinnedSchedules?: string[],
      newPinSelf?: boolean,
      newExpanded?: boolean
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
      if (newExpanded !== undefined) {
        setExpanded(newExpanded);
      }
    },
    [setCompare, setPinned, setPinSelf, setExpanded]
  );

  return {
    compare,
    pinned,
    pinSelf,
    expanded,
    setCompareState,
  };
}
