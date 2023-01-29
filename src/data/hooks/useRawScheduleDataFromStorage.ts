import { Immutable } from 'immer';
import { useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { renderDataNotPersistentNotification } from '../../components/DataNotPersistentNotification';
import { LoadingState } from '../../types';
import { AnyScheduleData } from '../types';

export const SCHEDULE_DATA_LOCAL_STORAGE_KEY =
  process.env.NODE_ENV === 'production' && !process.env['REACT_APP_PREVIEW']
    ? 'schedule-data'
    : 'schedule-data-dev';

type HookResult = {
  rawScheduleData: Immutable<AnyScheduleData> | null;
  setRawScheduleData: (
    next:
      | ((current: AnyScheduleData | null) => AnyScheduleData | null)
      | AnyScheduleData
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
      {
        defaultValue: null,
        storageSync: true,
      }
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

/**
 * Imperative version of `useRawScheduleDataFromStorage`;
 * just gets the current value from local storage.
 */
export function getCurrentRawScheduleFromStorage(): AnyScheduleData | null {
  const rawData = window.localStorage.getItem(SCHEDULE_DATA_LOCAL_STORAGE_KEY);
  if (rawData === null) return null;
  return JSON.parse(rawData) as AnyScheduleData;
}
