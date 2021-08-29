// Disable no-console for the entire file since this is the only location where
// any logging should be performed.
/* eslint-disable no-console */

// Disable max-classes-per-file since we want to colocate error definitions
/* eslint-disable max-classes-per-file */

import * as Sentry from '@sentry/react';

class WrappedError extends Error {
  prefix: string;

  topMessage: string;

  source: unknown;

  constructor(
    message: string,
    source: unknown,
    wrappedClassName: string,
    prefix: string
  ) {
    super();
    if (source instanceof Error) {
      this.message = `${message}: ${source.message}`;
      this.name = `${wrappedClassName}(${source.name})`;
      if (source.stack != null) this.stack = source.stack;
    } else {
      this.message = message;
      this.name = wrappedClassName;
    }

    this.prefix = prefix;
    this.topMessage = message;
    this.source = source;
  }

  logToConsole(fields: Record<string, unknown> = {}): void {
    console.group(`${this.prefix} error: ${this.topMessage}`);
    console.error({ source: this.source });
    if (Object.keys(fields).length > 0) {
      console.log({ fields });
    }
    console.groupEnd();
  }
}

class SoftError extends WrappedError {
  constructor(message: string, source: unknown) {
    super(message, source, 'SoftError', 'soft');
  }
}

/**
 * Logs an error to the console and reports it to Sentry.
 * Does not re-throw any errors and can be used when there is reasonable
 * fallback behavior.
 * @param message - error message that can be used to later identify the error
 * @param source - the source error, or `null` if none exists
 * @param fields - (optional) any additional fields to attach to the report
 */
export function softError(
  message: string,
  source: unknown,
  fields: Record<string, unknown> = {}
): void {
  // Log the error to the console
  const wrapped = new SoftError(message, source);
  wrapped.logToConsole(fields);

  // Report the error to Sentry if in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(wrapped, fields);
  }
}

class HardError extends WrappedError {
  constructor(message: string, source: unknown) {
    super(message, source, 'HardError', 'hard');
  }
}

/**
 * Logs an error to the console and reports it to Sentry. Throws a new error
 * that will halt execution until it is caught. This should only be used
 * when no reasonable fallback behavior is possible.
 *
 * **Note**: the thrown error will be a wrapper around the source error.
 * @param message - error message that can be used to later identify the error
 * @param source - the source error, or `null` if none exists
 * @param fields - (optional) any additional fields to attach to the report
 */
export function hardError(
  message: string,
  source: unknown,
  fields: Record<string, unknown> = {}
): never {
  // Log the error to the console
  const wrapped = new HardError(message, source);
  wrapped.logToConsole(fields);

  // Report the error to Sentry if in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(wrapped, fields);
  }

  throw wrapped;
}
