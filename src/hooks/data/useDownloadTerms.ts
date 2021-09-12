import { useState, useEffect } from 'react';
import axios from 'axios';

import { softError, ErrorWithFields } from '../../log';
import { LoadingState } from '../../types';
import { exponentialBackoff, isAxiosNetworkError } from '../../utils/misc';
import Cancellable from '../../utils/cancellable';

const CRAWLER_REPO = 'gt-scheduler/crawler';
const CRAWLER_BRANCH = 'gh-pages';
const GITHUB_API_URL = `https://api.github.com/repos/${CRAWLER_REPO}/contents?ref=${CRAWLER_BRANCH}`;

/**
 * Downloads the list of terms that the crawler has valid data for.
 * Repeatedly attempts to load in the case of errors,
 * and cancels itself once the parent context is unmounted.
 */
export default function useDownloadTerms(): LoadingState<string[]> {
  const [state, setState] = useState<LoadingState<string[]>>({
    type: 'loading',
  });

  // Fetch all terms via the GitHub API
  useEffect(() => {
    const loadOperation = new Cancellable();
    async function load(): Promise<void> {
      let attemptNumber = 1;
      while (!loadOperation.isCancelled) {
        try {
          const promise = axios.get<{ name: string }[]>(GITHUB_API_URL);
          const result = await loadOperation.perform(promise);
          if (result.cancelled) {
            return;
          }

          const newTerms = result.value.data
            .map((content) => content.name)
            .filter((name) => /\d{6}\.json/.test(name))
            .map((name) => name.replace(/\.json$/, ''))
            .sort()
            .reverse();

          // Ensure that there is at least 1 term before continuing
          if (newTerms.length === 0) {
            throw new ErrorWithFields({
              message: 'fetched list of terms is empty; cannot continue',
            });
          }

          setState({
            type: 'loaded',
            result: newTerms,
          });

          return;
        } catch (err) {
          // Report the error to Sentry if not a network error
          if (!isAxiosNetworkError(err)) {
            softError(
              new ErrorWithFields({
                message: 'error fetching list of terms',
                source: err,
                fields: {
                  url: GITHUB_API_URL,
                },
              })
            );
          }

          // Flag that an error has occurred
          setState({
            type: 'error',
            error:
              err instanceof Error
                ? err
                : new ErrorWithFields({
                    message: 'an error occurred while fetching terms',
                    source: err,
                  }),
            stillLoading: true,
            overview: String(err),
          });
        }

        // Sleep for an exponential backoff between each retry
        await exponentialBackoff(attemptNumber);
        attemptNumber += 1;
      }
    }

    load().catch(() => {
      // Unreachable
    });

    // Cancel the background load when this cleans up
    return (): void => {
      loadOperation.cancel();
    };
  }, [setState]);

  return state;
}
