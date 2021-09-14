/**
 * Coerces the type of the given argument to a `jest.MockedFunction<T>` value.
 * This function is an identity function on its input.
 */
export function asMockFunction<T extends (...args: never[]) => unknown>(
  f: T
): jest.MockedFunction<T> {
  return f as unknown as jest.MockedFunction<T>;
}

/**
 * Disables logging by mocking `console.*` functions to be no-ops.
 * Make sure mocks are cleared after using this.
 */
export function disableLogging(): void {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'group').mockImplementation(() => undefined);
}
