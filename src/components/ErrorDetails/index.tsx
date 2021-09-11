import React from 'react';
import safeStringify from 'fast-safe-stringify';

import { ErrorWithFields } from '../../log';
import { classes } from '../../utils/misc';

export type ErrorDetailsFieldProps = {
  name: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

/**
 * A single field in an error details component
 */
export function ErrorDetailsField({
  name,
  children,
  style,
  className,
}: ErrorDetailsFieldProps): React.ReactElement {
  return (
    <div className={classes(className, 'error-details-field')} style={style}>
      <strong>{name}</strong>: {children}
    </div>
  );
}

export type ReactErrorDetailsProps = {
  error: Error;
  errorInfo: React.ErrorInfo | null;
};

/**
 * Shows debug information for an error using react error info.
 */
export function ReactErrorDetails({
  error,
  errorInfo,
}: ReactErrorDetailsProps): React.ReactElement {
  return (
    <>
      <BaseErrorDetails error={error} />
      {errorInfo !== null && (
        <ErrorDetailsField name="Component stacktrace">
          <pre>
            <code>{errorInfo.componentStack.replace(/^[\n\r]+/, '')}</code>
          </pre>
        </ErrorDetailsField>
      )}
    </>
  );
}

export type LoadingErrorDetailsProps = {
  error: Error;
  overview: React.ReactNode;
  name: string;
};

/**
 * Shows debug information for an error that occurred while loading.
 */
export function LoadingErrorDetails({
  error,
  overview,
  name,
}: LoadingErrorDetailsProps): React.ReactElement {
  return (
    <>
      <BaseErrorDetails error={error} />
      <ErrorDetailsField name="Operation name">
        (loading) {name}
      </ErrorDetailsField>
      <ErrorDetailsField name="Overview">{overview}</ErrorDetailsField>
    </>
  );
}

export type BaseErrorDetailsProps = {
  error: Error;
};

/**
 * Shows debug information for an instance of `Error`.
 */
export function BaseErrorDetails({
  error,
}: BaseErrorDetailsProps): React.ReactElement {
  return (
    <>
      <ErrorDetailsField name="Name">{error.name}</ErrorDetailsField>
      <ErrorDetailsField name="Message">{error.message}</ErrorDetailsField>
      <ErrorDetailsField name="Version">
        {process.env['REACT_APP_SENTRY_VERSION']}
      </ErrorDetailsField>
      {error instanceof ErrorWithFields && (
        <ErrorDetailsField name="Fields">
          <pre>
            <code>
              {Object.entries(error.getAllFields())
                .map(([key, value]) => `    ${key}: ${safeStringify(value)}`)
                .join('\n')}
            </code>
          </pre>
        </ErrorDetailsField>
      )}
      <ErrorDetailsField name="Stacktrace">
        <pre>
          <code>{error.stack ?? '~'}</code>
        </pre>
      </ErrorDetailsField>
    </>
  );
}
