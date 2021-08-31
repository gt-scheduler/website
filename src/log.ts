// Disable no-console for the entire file since this is the only location where
// any logging should be performed.
/* eslint-disable no-console */

import * as Sentry from '@sentry/react';

export class ErrorWithFields extends Error {
  fields: Record<string, unknown>;

  source: unknown;

  topMessage: string;

  baseName: string;

  constructor({
    message,
    source,
    fields = {},
    baseName = 'ErrorWithFields',
  }: {
    message: string;
    source?: unknown;
    fields?: Record<string, unknown>;
    baseName?: string;
  }) {
    super();
    if (source instanceof Error) {
      this.message = `${message}: ${source.message}`;
      if (source.stack != null) this.stack = source.stack;
    } else {
      this.message = message;
    }

    this.baseName = baseName;
    this.name = this.getName();
    this.fields = fields;
    this.source = source;
    this.topMessage = message;
  }

  logToConsole(): void {
    console.group(`error: ${this.topMessage}`);
    console.error({ source: this.source });

    const allFields = this.getAllFields();
    if (Object.keys(allFields).length > 0) {
      console.log(allFields);
    }

    console.groupEnd();
  }

  getName(): string {
    let baseName: string | null = null;
    if (this.source instanceof ErrorWithFields) {
      baseName = this.source.getName();
    } else if (this.source instanceof Error) {
      baseName = this.source.name;
    }

    if (baseName === null) return this.name;
    return `${this.name}(${baseName})`;
  }

  getAllFields(): Record<string, unknown> {
    if (this.source instanceof ErrorWithFields) {
      return { ...this.source.getAllFields(), ...this.fields };
    }
    return this.fields;
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
    let fields = error.getAllFields();
    if (Object.keys(fields).includes('type')) {
      const { type, ...rest } = fields;
      fields = { __do_not_use_type_in_sentry_it_is_special: type, ...rest };
    }

    Sentry.captureException(error, {
      contexts: {
        // https://docs.sentry.io/platforms/ruby/enriching-events/context/#structured-context
        fields,
      },
    });
  }
}
