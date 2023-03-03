import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import { Immutable } from 'immer';

import { auth } from '../firebase';
import { ErrorWithFields, softError } from '../../log';
import { LoadingState } from '../../types';
import {
  exponentialBackoff,
  isAxiosNetworkError,
  sleep,
} from '../../utils/misc';
import Cancellable from '../../utils/cancellable';
import { CLOUD_FUNCTION_BASE_URL } from '../../constants';
import { FriendIds, RawFriendScheduleData } from '../types';

interface HookResult {
  friendScheduleData: RawFriendScheduleData;
  term: string;
}

const url = `${CLOUD_FUNCTION_BASE_URL}/fetchFriendSchedules`;

// Number of minutes between re-fetches of the friend schedules
const REFRESH_INTERVAL_MIN = 5;

/**
 * Fetches the schedules of friends that have been shared with the user
 * for the given term.
 * Repeatedly attempts to load in the case of errors,
 * and cancels any in-flight downloads if the parent context is unmounted
 * or the term is changed.
 * Once loaded, this also attempts to update the data every 5 minutes
 * in case the friends' schedules have been updated.
 */
export default function useRawFriendScheduleDataFromFirebaseFunction({
  currentTerm,
  termFriendData,
}: {
  currentTerm: string;
  termFriendData: Immutable<FriendIds>;
}): LoadingState<HookResult> {
  const [state, setState] = useState<LoadingState<HookResult>>({
    type: 'loading',
  });

  // Keep a ref of the latest loaded schedules
  // to check if it is any newer than the current one.
  const loadedFriendScheduleRef = useRef<HookResult | null>(null);

  // Fetch the current term's friend schedules information
  useEffect(() => {
    if (Object.keys(termFriendData).length === 0) {
      const res = {
        friendScheduleData: {},
        term: currentTerm,
      };
      loadedFriendScheduleRef.current = res;
      return setState({
        type: 'loaded',
        result: res,
      });
    }
    const loadOperation = new Cancellable();

    async function loadAndRefresh(): Promise<void> {
      let isFirst = true;
      while (!loadOperation.isCancelled) {
        // Load the friend schedules, showing errors only if this is the
        // first time it is being loaded (otherwise, just log errors
        // but don't disrupt the user). This is to prevent
        // a background refresh from showing an error screen
        // in the middle of a session.
        // `load` will return early if it is cancelled
        await load({ initialLoad: isFirst });
        if (loadOperation.isCancelled) return;

        // Sleep for the refresh interval,
        // exiting early if cancelled
        const promise = sleep({ amount_ms: REFRESH_INTERVAL_MIN * 60 * 1000 });
        const result = await loadOperation.perform(promise);
        if (result.cancelled) {
          return;
        }

        isFirst = false;
      }
    }

    async function load({
      initialLoad,
    }: {
      initialLoad: boolean;
    }): Promise<void> {
      if (initialLoad) {
        setState({
          type: 'loading',
        });
      }

      let attemptNumber = 1;
      while (!loadOperation.isCancelled) {
        try {
          const test = {
            IDToken: await auth.currentUser?.getIdToken(),
            friends: termFriendData,
            term: currentTerm,
          };
          const promise = axios.post<RawFriendScheduleData>(url, test, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const result = await loadOperation.perform(promise);
          if (result.cancelled) {
            return;
          }

          const json = result.value.data;

          // If the data is the same as the currently loaded data,
          // skip loading it
          if (
            loadedFriendScheduleRef.current !== null &&
            loadedFriendScheduleRef.current.friendScheduleData === json &&
            loadedFriendScheduleRef.current.term === currentTerm
          ) {
            // Skip this update
            return;
          }

          const res = {
            friendScheduleData: json,
            term: currentTerm,
          };

          setState({
            type: 'loaded',
            result: res,
          });
          loadedFriendScheduleRef.current = res;

          return;
        } catch (err) {
          // Report the error to Sentry if not a network error
          if (!isAxiosNetworkError(err)) {
            softError(
              new ErrorWithFields({
                message: 'error fetching friend schedules',
                source: err,
                fields: {
                  url,
                  term: currentTerm,
                  termFriendData,
                },
              })
            );
          }

          if (initialLoad) {
            // Flag that an error has occurred
            setState({
              type: 'error',
              error:
                err instanceof Error
                  ? err
                  : new ErrorWithFields({
                      message:
                        'an error occurred while fetching friend schedules',
                      source: err,
                    }),
              stillLoading: true,
              overview: String(err),
            });
          }
        }

        // Sleep for an exponential backoff between each retry
        await exponentialBackoff(attemptNumber);
        attemptNumber += 1;
      }
    }

    loadAndRefresh().catch((err) => {
      softError(
        new ErrorWithFields({
          message: 'error loading and refreshing friend schedules',
          source: err,
          fields: {
            url,
            term: currentTerm,
            termFriendData,
          },
        })
      );
    });

    // Cancel the background load when this cleans up
    return (): void => {
      loadOperation.cancel();
    };
  }, [currentTerm, termFriendData, setState]);

  // If we are about to start a new background load
  // after the term changed, then don't return the already fetched
  // friend schedules
  if (state.type === 'loaded' && state.result.term !== currentTerm) {
    return { type: 'loading' };
  }

  return state;
}
