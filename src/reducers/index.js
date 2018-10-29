import { actions as envActions } from './env';
import { actions as oscarActions } from './oscar';
import { actions as userActions } from './user';

export { default as env } from './env';
export { default as oscar } from './oscar';
export { default as user } from './user';

export const actions = {
  ...envActions,
  ...oscarActions,
  ...userActions,
};
