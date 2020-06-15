import { combineActions, createAction, handleActions } from 'redux-actions';

const prefix = 'DB';

const setOscar = createAction(`${prefix}/SET_OSCAR`, (oscar) => ({ oscar }));

export const actions = {
  setOscar,
};

const defaultState = {
  oscar: null,
};

export default handleActions(
  {
    [combineActions(setOscar)]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  defaultState
);
