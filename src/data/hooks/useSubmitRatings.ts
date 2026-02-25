import axios, { AxiosPromise } from 'axios';
import { useState } from 'react';
import { Immutable } from 'immer';

import { auth } from '../firebase';
import { ErrorWithFields, softError } from '../../log';
import { SubmitRatingsRequestData } from '../types';
import {
  LoadingState,
  LoadingStateLoaded,
  LoadingStateError,
  LoadingStateLoading,
} from '../../types';
import { exponentialBackoff, isAxiosNetworkError } from '../../utils/misc';
import Cancellable from '../../utils/cancellable';
import { validateMetricData } from '../../utils/validation';
import { CLOUD_FUNCTION_BASE_URL } from '../../constants';
import useDeepCompareEffect from '../../hooks/useDeepCompareEffect';
import firebase from 'firebase';
import useRateLimiter from '../../hooks/useRateLimiter';

type HookResult = {
  success: boolean;
};

// const url = `${CLOUD_FUNCTION_BASE_URL}/submitRatings`;
const url = `http://127.0.0.1:5001/gt-scheduler-web-dev/us-east1/submitRatings`;
const MAX_RETRIES = 3;

export const RATINGS_LIMITER_KEY =
  process.env.NODE_ENV === 'production' && !process.env['REACT_APP_PREVIEW']
    ? 'ratings-submission-limiter'
    : 'ratings-submission-limiter-dev';

const RATINGS_LIMITER_CAPACITY = 1;
const RATINGS_LIMITER_INTERVAL_SEC = 5;

export default function useSubmitRatings({
  requestData,
}: {
  requestData: Immutable<Omit<SubmitRatingsRequestData, 'IDToken'>>;
}): LoadingState<HookResult> {
  const [state, setState] = useState<LoadingState<HookResult>>({
    type: 'loading',
  } as LoadingStateLoading);
  const { hasReachedLimit, refreshBucket, decrementBucketCount } =
    useRateLimiter(
      RATINGS_LIMITER_KEY,
      RATINGS_LIMITER_CAPACITY,
      RATINGS_LIMITER_INTERVAL_SEC
    );

  useDeepCompareEffect(() => {
    if (
      !requestData ||
      !requestData.ratings ||
      requestData.ratings.length === 0
    ) {
      return;
    }

    refreshBucket();
    if (hasReachedLimit) {
      const err = new ErrorWithFields({
        message: 'error submitting metrics',
        source: new Error('Exceeded rate limit'),
        fields: {
          url,
          requestData,
          hasReachedLimit,
        },
      });
      softError(err);
      setState({
        type: 'error',
        error: err,
        stillLoading: false,
        overview: String(err),
      } as LoadingStateError);
      return;
    }

    decrementBucketCount();

    const submitOperation = new Cancellable();

    async function submit(): Promise<void> {
      setState({
        type: 'loading',
      } as LoadingStateLoading);

      if (!validateMetricData(requestData)) {
        const validationError = new ErrorWithFields({
          message: 'an error occurred while validating metrics data',
        });

        softError(
          new ErrorWithFields({
            message: 'validation failed for metrics submission',
            source: validationError,
            fields: {
              url,
              requestData,
            },
          })
        );

        setState({
          type: 'error',
          error: validationError,
          stillLoading: false,
          overview: validationError.message,
        } as LoadingStateError);

        return;
      }

      let attemptNumber = 1;
      while (!submitOperation.isCancelled && attemptNumber <= MAX_RETRIES) {
        try {
          const { currentUser } = firebase.auth();
          if (!currentUser) {
            throw new ErrorWithFields({
              message: 'user is not authenticated',
            });
          }

          const IDToken = await currentUser.getIdToken();

          const requestDataString = JSON.stringify({
            IDToken,
            ...requestData,
          });

          const promise = axios({
            method: 'POST',
            url,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: `data=${encodeURIComponent(requestDataString)}`,
          }) as AxiosPromise<HookResult>;

          const result = await submitOperation.perform(promise);
          if (result.cancelled) {
            return;
          }

          setState({
            type: 'loaded',
            result: { success: true },
          } as LoadingStateLoaded<HookResult>);

          return;
        } catch (err) {
          if (!isAxiosNetworkError(err)) {
            softError(
              new ErrorWithFields({
                message: 'error submitting metrics',
                source: err,
                fields: {
                  url,
                  requestData,
                },
              })
            );
          }

          setState({
            type: 'error',
            error:
              err instanceof Error
                ? err
                : new ErrorWithFields({
                    message: 'an error occurred while submitting metrics',
                    source: err,
                  }),
            stillLoading: attemptNumber < MAX_RETRIES,
            overview: String(err),
          } as LoadingStateError);

          await exponentialBackoff(attemptNumber);
          attemptNumber += 1;
        }
      }
    }

    submit().catch((err) => {
      softError(
        new ErrorWithFields({
          message: 'error submitting metrics',
          source: err,
          fields: {
            url,
            requestData,
          },
        })
      );
    });

    return (): void => {
      submitOperation.cancel();
    };
  }, [
    requestData,
    setState,
    hasReachedLimit,
    refreshBucket,
    decrementBucketCount,
  ]);

  return state;
}
