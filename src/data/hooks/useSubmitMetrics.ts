import axios, { AxiosPromise } from 'axios';
import { useState } from 'react';
import { Immutable } from 'immer';

import { auth } from '../firebase';
import { ErrorWithFields, softError } from '../../log';
import { SubmitMetricsRequestData } from '../types';
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

type HookResult = {
  success: boolean;
};

const url = `${CLOUD_FUNCTION_BASE_URL}/submitMetrics`;
const MAX_RETRIES = 3;

export default function useSubmitMetrics({
  requestData,
}: {
  requestData: Immutable<Omit<SubmitMetricsRequestData, 'IDToken'>>;
}): LoadingState<HookResult> {
  const [state, setState] = useState<LoadingState<HookResult>>({
    type: 'loading',
  } as LoadingStateLoading);

  useDeepCompareEffect(() => {
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
        } as LoadingStateError);

        return;
      }

      let attemptNumber = 1;
      while (!submitOperation.isCancelled && attemptNumber <= MAX_RETRIES) {
        try {
          const requestDataString = JSON.stringify({
            IDToken: await auth.currentUser?.getIdToken(),
            ...requestData,
          });

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
            metricName: requestData.metricName,
            targets: requestData.targets,
          },
        })
      );
    });

    return (): void => {
      submitOperation.cancel();
    };
  }, [requestData, setState]);

  return state;
}
