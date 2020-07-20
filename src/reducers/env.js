import { combineActions, createAction, handleActions } from 'redux-actions';
import { isMobile } from '../utils';

const prefix = 'ENV';

const setMobile = createAction(`${prefix}/SET_MOBILE`, (mobile) => ({
  mobile,
}));

const setOverlayCrns = createAction(`${prefix}/SET_OVERLAY_CRNS`, (overlayCrns) => ({
  overlayCrns,
}));

export const actions = {
  setMobile,
  setOverlayCrns,
};

const defaultState = {
  mobile: isMobile(),
  overlayCrns: [],
};

export default handleActions(
  {
    [combineActions(
      setMobile,
      setOverlayCrns,
    )]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  },
  defaultState,
);
