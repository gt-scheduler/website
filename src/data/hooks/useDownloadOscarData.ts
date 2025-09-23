import axios from 'axios';
import { useEffect, useState, useRef } from 'react';

import { Oscar } from '../beans';
import { ErrorWithFields, softError } from '../../log';
import { CrawlerTermData, LoadingState } from '../../types';
import {
  exponentialBackoff,
  isAxiosNetworkError,
  sleep,
} from '../../utils/misc';
import Cancellable from '../../utils/cancellable';
import { CRAWLER_BASE_URL } from '../../constants';

const constructTermDataUrl = (term: string): string =>
  `${CRAWLER_BASE_URL}/${term}.json`;

// Number of minutes between re-downloads of the oscar data
const REFRESH_INTERVAL_MIN = 15;

/**
 * Downloads the crawled data from Oscar that the crawler prepared
 * for the given term.
 * Repeatedly attempts to load in the case of errors,
 * and cancels any in-flight downloads if the parent context is unmounted
 * or the term is changed.
 * Once loaded, this also attempts to update the data every 15 minutes
 * in case the crawler has run again and there is updated data.
 * @param term - The term to fetch crawler data for
 */
export default function useDownloadOscarData(
  term: string
): LoadingState<Oscar> {
  const [state, setState] = useState<LoadingState<Oscar>>({
    type: 'loading',
  });

  // Keep a ref of the latest loaded Oscar
  // to check if it is any newer than the current one.
  const loadedOscarRef = useRef<Oscar | null>(null);

  // Fetch the current term's crawler information
  useEffect(() => {
    const loadOperation = new Cancellable();
    const url = constructTermDataUrl(term);
    async function loadAndRefresh(): Promise<void> {
      let isFirst = true;
      while (!loadOperation.isCancelled) {
        // Load the oscar data, showing errors only if this is the first time
        // it is being loaded (otherwise, just log errors
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
          const promise = axios.get<CrawlerTermData>(url);
          const result = await loadOperation.perform(promise);
          if (result.cancelled) {
            return;
          }

          const json = result.value.data;

          // If the data is the same as the currently loaded data,
          // skip loading it
          if (
            loadedOscarRef.current !== null &&
            new Date(json.updatedAt).getTime() ===
              loadedOscarRef.current?.updatedAt.getTime()
          ) {
            // Skip this update
            return;
          }

          const oscar = new Oscar(json, term);
          setState({
            type: 'loaded',
            result: oscar,
          });
          loadedOscarRef.current = oscar;

          return;
        } catch (err) {
          // Report the error to Sentry if not a network error
          if (!isAxiosNetworkError(err)) {
            softError(
              new ErrorWithFields({
                message: 'error fetching crawler data',
                source: err,
                fields: {
                  term,
                  url,
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
                      message: 'an error occurred while fetching crawler data',
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
          message: 'error loading and refreshing oscar data',
          source: err,
          fields: {
            term,
            url,
          },
        })
      );
    });

    // Cancel the background load when this cleans up
    return (): void => {
      loadOperation.cancel();
    };
  }, [term, setState]);

  // If we are about to start a new background load
  // after the term changed, then don't return a loaded Oscar
  if (state.type === 'loaded' && state.result.term !== term) {
    return { type: 'loading' };
  }

  return state;
}
