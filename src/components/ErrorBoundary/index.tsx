import React, { ErrorInfo } from 'react';

import { ErrorWithFields, softError } from '../../log';

type ErrorBoundaryProps = {
  fallback?: (error: Error, errorInfo: ErrorInfo | null) => React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
  info: ErrorInfo | null;
};

/**
 * Wraps hard errors in the component tree, showing a fallback display
 * so that the error doesn't entirely crash the app.
 * Additionally reports the error to Sentry.
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, info: null };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log & report to Sentry
    softError(
      new ErrorWithFields({
        message: 'ErrorBoundary caught error from further in render tree',
        source: error,
        fields: {
          reactErrorInfo: info,
        },
      })
    );

    this.setState({ info });
  }

  override render(): React.ReactElement | null {
    const { children, fallback } = this.props;
    const { error, info } = this.state;

    if (error !== null) {
      if (fallback != null) {
        return <>{fallback(error, info)}</>;
      }

      return null;
    }

    return <>{children}</>;
  }
}
