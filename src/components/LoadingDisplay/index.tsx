import React from 'react';

import {
  LoadingStateLoading,
  LoadingStateError,
  LoadingStateCustom,
} from '../../types';
import { LoadingErrorDetails } from '../ErrorDetails';
import ErrorDisplay from '../ErrorDisplay';
import ErrorHeader from '../ErrorHeader';
import Spinner from '../Spinner';

import './stylesheet.scss';

export type LoadingDisplayProps = {
  state: LoadingStateLoading | LoadingStateError | LoadingStateCustom;
  name: string;
};

/**
 * Renders a `LoadingState<T>` value,
 * showing a spinner if the state is loading,
 * and an error otherwise if an error ocurred.
 */
export default function LoadingDisplay({
  state,
  name,
}: LoadingDisplayProps): React.ReactElement {
  let contents: React.ReactNode;
  if (state.type === 'loading') {
    contents = (
      <>
        <Spinner size="normal" style={{ opacity: 0.6 }} />
        <h4>Loading</h4>
        <div>{name}</div>
      </>
    );
  } else if (state.type === 'custom') {
    // Don't wrap custom contents in the outer div
    return <>{state.contents}</>;
  } else if (state.stillLoading) {
    contents = (
      <>
        <Spinner size="normal" style={{ opacity: 0.6 }} />
        <h4>Loading</h4>
        <ErrorDisplay
          errorDetails={
            <LoadingErrorDetails
              error={state.error}
              overview={state.overview}
              name={name}
            />
          }
        >
          <div>
            An error ocurred while loading {name}: {state.overview}
          </div>
          <div>
            The application is retrying in the background, so the issue may
            resolve itself. If it doesn&apos;t, try refreshing the page.
          </div>
        </ErrorDisplay>
      </>
    );
  } else {
    contents = (
      <>
        <ErrorHeader />
        <ErrorDisplay
          errorDetails={
            <LoadingErrorDetails
              error={state.error}
              overview={state.overview}
              name={name}
            />
          }
        >
          <div>
            An unrecoverable error ocurred while loading {name}:{' '}
            {state.overview}
          </div>
          <div>Try refreshing the page to see if it fixes the issue.</div>
        </ErrorDisplay>
      </>
    );
  }

  return <div className="loading-display">{contents}</div>;
}
