import { actions as dbActions } from './db';
import { actions as envActions } from './env';
import { actions as userActions } from './user';

export { default as db } from './db';
export { default as env } from './env';
export { default as user } from './user';

export const actions = {
  ...dbActions,
  ...envActions,
  ...userActions,
};
