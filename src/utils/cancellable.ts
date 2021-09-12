export const cancelledSymbol = Symbol('__#Cancellable-cancelled-symbol');

/**
 * Gives an awaitable class (via `promise`) that can be cancelled at any time.
 * Useful when combined with `Promise.race` to cancel background tasks.
 */
export default class Cancellable {
  isCancelled: boolean;

  cancel: () => void;

  promise: Promise<symbol>;

  constructor() {
    this.isCancelled = false;
    this.cancel = (): void => undefined;
    this.promise = new Promise<symbol>((resolve) => {
      this.cancel = (): void => {
        this.isCancelled = true;
        resolve(cancelledSymbol);
      };
    });
  }

  /**
   * Runs a promise to completion, returning its value.
   * However, if this operation was cancelled before the promise completed,
   * then it instead returns an object with `cancelled` true.
   * The promise will still complete, but its value will be ignored.
   */
  async perform<T>(
    other: Promise<T>
  ): Promise<{ cancelled: true } | { cancelled: false; value: T }> {
    const result = await Promise.race([this.promise, other]);

    if (result === cancelledSymbol) {
      return { cancelled: true };
    }

    return {
      cancelled: false,
      value: result as T,
    };
  }
}
