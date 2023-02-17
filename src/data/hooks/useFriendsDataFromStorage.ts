import { Immutable } from 'immer';
import { useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { renderDataNotPersistentNotification } from '../../components/DataNotPersistentNotification';
import { LoadingState } from '../../types';
import { FriendsData } from '../types';

export const FRIENDS_DATA_LOCAL_STORAGE_KEY = 'friends-data';

type HookResult = {
  friendsData: Immutable<FriendsData> | null;
  setFriendsData: (
    next: ((current: FriendsData | null) => FriendsData | null) | FriendsData
  ) => void;
};

/**
 * Gets the current schedule data from local storage.
 * Do not call this function in a non-root component;
 * it should only be called once in a root component (i.e. <App>).
 */
// eslint-disable-next-line max-len
export default function useRawScheduleDataFromStorage(): LoadingState<HookResult> {
  const [friendsData, setFriendsData, { isPersistent }] =
    useLocalStorageState<FriendsData | null>(FRIENDS_DATA_LOCAL_STORAGE_KEY, {
      defaultValue: null,
      storageSync: true,
    });

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
      friendsData,
      setFriendsData,
    },
  };
}

/**
 * Imperative version of `useRawScheduleDataFromStorage`;
 * just gets the current value from local storage.
 */
export function getCurrentFriendsFromStorage(): FriendsData | null {
  const rawData = window.localStorage.getItem(FRIENDS_DATA_LOCAL_STORAGE_KEY);
  if (rawData === null) return null;
  return JSON.parse(rawData) as FriendsData;
}
