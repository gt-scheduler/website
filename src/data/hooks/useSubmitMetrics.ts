import axios, { AxiosPromise } from 'axios';
import { useState } from 'react';
import { Immutable } from 'immer';

import { auth } from '../firebase';
import { ErrorWithFields, softError } from '../../log';
import { SubmitMetricsRequestData } from '../types';
import { LoadingState } from '../../types';
import { exponentialBackoff, isAxiosNetworkError } from '../../utils/misc';
import Cancellable from '../../utils/cancellable';
import { CLOUD_FUNCTION_BASE_URL } from '../../constants';
import useDeepCompareEffect from '../../hooks/useDeepCompareEffect';

type HookResult = {
  success: boolean;
};

const url = `${CLOUD_FUNCTION_BASE_URL}/submitMetrics`;

const MAX_RETRIES = 3;

/**
 * Submits metrics data to a Firebase cloud function for the given request data.
 * Retries up to 3 times on errors
 */
export default function useSubmitMetrics({
  requestData,
}: {
  requestData: Immutable<SubmitMetricsRequestData>;
}): LoadingState<HookResult> {
  const [state, setState] = useState<LoadingState<HookResult>>({
    type: 'loading',
  });

  useDeepCompareEffect(() => {
    const submitOperation = new Cancellable();

    async function submit(): Promise<void> {
      setState({
        type: 'loading',
      });

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
              metricName: requestData.metricName,
              targets: requestData.targets,
            },
          })
        );
        setState({
          type: 'error',
          error: validationError,
          stillLoading: false,
          overview: validationError.message,
        });
        return;
      }

      let attemptNumber = 1;
      while (!submitOperation.isCancelled && attemptNumber <= MAX_RETRIES) {
        try {
          const requestDataString = JSON.stringify({
            IDToken: await auth.currentUser?.getIdToken(),
            ...requestData,
          });
          /* eslint-disable max-len */
          // This request should be made with content type is application/x-www-form-urlencoded.
          // This is done to prevent a pre-flight CORS request made to the firebase function.
          /* eslint-enable max-len */
          const promise = axios({
            method: 'POST',
            url,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: `data=${requestDataString}`,
          }) as AxiosPromise<HookResult>;

          const result = await submitOperation.perform(promise);
          if (result.cancelled) {
            return;
          }

          setState({
            type: 'loaded',
            result: { success: true },
          });

          return;
        } catch (err) {
          if (!isAxiosNetworkError(err)) {
            softError(
              new ErrorWithFields({
                message: 'error submitting metrics',
                source: err,
                fields: {
                  url,
                  metricName: requestData.metricName,
                  targets: requestData.targets,
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
          });

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
            metricName: requestData.metricName,
            targets: requestData.targets,
          },
        })
      );
    });

    // Cancel the submission when this cleans up
    return (): void => {
      submitOperation.cancel();
    };
  }, [requestData, setState]);

  return state;
}

function validateMetricData(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as SubmitMetricsRequestData;

  if (!['difficulty', 'recommended'].includes(d.metricName)) return false;
  if (!Array.isArray(d.targets)) return false;

  for (const target of d.targets) {
    if (typeof target !== 'object' || target === null) return false;
    if (!['professor', 'course', 'section'].includes(target.type)) return false;
    if (typeof target.reference !== 'string') return false;

    switch (target.type) {
      case 'course': {
        // ABCD 1234
        if (!/^[A-Z]+ \d{4}$/.test(target.reference)) return false;
        break;
      }

      case 'professor': {
        // FirstName LastName
        const nameParts = target.reference.split(' ');
        if (nameParts.length !== 2) return false;
        break;
      }

      case 'section': {
        // ABC01
        if (!/^[A-Z]+\d+$/.test(target.reference)) return false;
        break;
      }

      default: {
        return false;
      }
    }
  }

  // YYYYMM
  if (d.semester !== undefined) {
    if (typeof d.semester !== 'number') return false;
    if (!/^\d{6}$/.test(String(d.semester))) return false;
  }

  return true;
}
