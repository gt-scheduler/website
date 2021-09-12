import * as Sentry from '@sentry/react';
import fastSafeStringify from 'fast-safe-stringify';

export class ErrorWithFields extends Error {
  fields: Record<string, unknown>;

  topMessage: string;

  source: Error | null;

  constructor({
    message,
    source,
    fields = {},
  }: {
    message: string;
    source?: unknown;
    fields?: Record<string, unknown>;
  }) {
    super();

    this.fields = fields;
    this.topMessage = message;

    // Make sure the given source is an error if given,
    // otherwise add its string serialization as a field
    if (source instanceof Error) {
      this.source = source;
      this.message = `${message}: ${source.message}`;

      // Try to inherit the stacktrace of the given error
      // (otherwise, fall back to the stacktrace created
      // when this error was constructed)
      if (source.stack != null) {
        this.stack = source.stack;
      }
    } else {
      this.source = null;
      this.message = message;

      if (this.source !== null) {
        // The source was non-null but was not an Error:
        // add a naive string serialization as a context
        this.fields['__non_error_source'] = 'true';
        this.fields['__source'] = fastSafeStringify(source);
      }
    }

    // Configure the name based on whether this is wrapping
    // an existing non-wrapped error
    const rootError = this.getRootError();
    if (rootError === this || rootError instanceof ErrorWithFields) {
      this.name = 'ErrorWithFields';
    } else {
      this.name = `ErrorWithFields(${rootError.name})`;
    }
  }

  logToConsole(): void {
    /* eslint-disable no-console */
    console.group(this.topMessage);
    console.error(this.getRootError());

    const allFields = this.getAllFields();
    if (Object.keys(allFields).length > 0) {
      console.info(allFields);
    }

    console.groupEnd();
    /* eslint-enable no-console */
  }

  getAllFields(): Record<string, unknown> {
    if (this.source instanceof ErrorWithFields) {
      return { ...this.source.getAllFields(), ...this.fields };
    }

    return this.fields;
  }

  getRootError(): Error {
    if (this.source === null) {
      return this;
    }

    if (this.source instanceof ErrorWithFields) {
      return this.source.getRootError();
    }

    return this.source;
  }
}

/**
 * Logs an error to the console and reports it to Sentry.
 * Does not re-throw any errors and can be used when there is reasonable
 * fallback behavior.
 * @param error - an instance of `ErrorWithFields`
 */
export function softError(error: ErrorWithFields): void {
  error.logToConsole();

  // Report the error to Sentry if in production
  if (process.env.NODE_ENV === 'production') {
    // Ensure we don't include `type` in the fields
    let fields = error.getAllFields();
    if (Object.keys(fields).includes('type')) {
      const { type, ...rest } = fields;
      fields = { __do_not_use_type_in_sentry_it_is_special: type, ...rest };
    }

    Sentry.captureException(error.getRootError(), {
      // https://docs.sentry.io/platforms/ruby/enriching-events/context/#structured-context
      contexts: {
        fields,
        error: {
          message: error.message,
        },
      },
      fingerprint: [error.message],
    });
  }
}
