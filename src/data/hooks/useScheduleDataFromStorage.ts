import { Immutable } from 'immer';
import { useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { renderDataNotPersistentNotification } from '../../components/DataNotPersistentNotification';
import { LoadingState } from '../../types';
import { AnyScheduleData } from '../types';

export const SCHEDULE_DATA_LOCAL_STORAGE_KEY = 'schedule-data';

type HookResult = {
  rawScheduleData: Immutable<AnyScheduleData> | null;
  setRawScheduleData: (
    next:
      | ((current: AnyScheduleData | null) => AnyScheduleData | null)
      | AnyScheduleData
      | null
  ) => void;
};

/**
 * Gets the current schedule data from local storage.
 * Do not call this function in a non-root component;
 * it should only be called once in a root component (i.e. <App>).
 */
// eslint-disable-next-line max-len
export default function useRawScheduleDataFromStorage(): LoadingState<HookResult> {
  const [rawScheduleData, setRawScheduleData, { isPersistent }] =
    useLocalStorageState<AnyScheduleData | null>(
      SCHEDULE_DATA_LOCAL_STORAGE_KEY,
      null
    );

  const [userAcceptedNonPersistence, setUserAcceptedNonPersistence] =
    useState(false);

  // If the state isn't persistent, then return an error to alert the user
  // requiring them to acknowledge this before continuing
  if (!isPersistent && !userAcceptedNonPersistence) {
    return {
      type: 'custom',
      contents: renderDataNotPersistentNotification({
        onAccept: (): void => {
          setUserAcceptedNonPersistence(true);
        },
      }),
    };
  }

  return {
    type: 'loaded',
    result: {
      rawScheduleData,
      setRawScheduleData,
    },
  };
}
