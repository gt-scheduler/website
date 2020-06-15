import { combineActions, createAction, handleActions } from 'redux-actions';
import { isMobile } from '../utils';

const prefix = 'ENV';

const setMobile = createAction(`${prefix}/SET_MOBILE`, (mobile) => ({
  mobile,
}));

export const actions = {
  setMobile,
};

const defaultState = {
  mobile: isMobile(),
};

export default handleActions(
  {
    [combineActions(setMobile)]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  defaultState
);
