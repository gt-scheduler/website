import { combineActions, createAction, handleActions } from 'redux-actions';

const prefix = 'OSCAR';

const setCourses = createAction(`${prefix}/SET_COURSES`, courses => ({ courses }));
const setCrns = createAction(`${prefix}/SET_CRNS`, crns => ({ crns }));

export const actions = {
  setCourses,
  setCrns,
};

const defaultState = {
  courses: {},
  crns: {},
};

export default handleActions({
  [combineActions(
    setCourses,
    setCrns,
  )]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
}, defaultState);
