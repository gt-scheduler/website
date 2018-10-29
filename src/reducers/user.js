import { combineActions, createAction, handleActions } from 'redux-actions';
import Cookies from 'js-cookie';

const prefix = 'USER';

const setDesiredCourses = createAction(`${prefix}/SET_DESIRED_COURSES`, desiredCourses => ({ desiredCourses }));
const setPinnedCrns = createAction(`${prefix}/SET_PINNED_CRNS`, pinnedCrns => ({ pinnedCrns }));
const setExcludedCrns = createAction(`${prefix}/SET_EXCLUDED_CRNS`, excludedCrns => ({ excludedCrns }));

export const actions = {
  setDesiredCourses,
  setPinnedCrns,
  setExcludedCrns,
};

const saveData = ({ desiredCourses = [], pinnedCrns = [], excludedCrns = [] }) => {
  Cookies.set('data', JSON.stringify({ desiredCourses, pinnedCrns, excludedCrns }), { expires: 365 });
};

const loadData = () => {
  let json = null;
  try {
    json = JSON.parse(Cookies.get('data'));
  } catch (e) {
    json = {};
  }
  const { desiredCourses = [], pinnedCrns = [], excludedCrns = [] } = json;
  return { desiredCourses, pinnedCrns, excludedCrns };
};

const defaultState = loadData();

export default handleActions({
  [combineActions(
    setDesiredCourses,
    setPinnedCrns,
    setExcludedCrns,
  )]: (state, { payload }) => {
    const newState = {
      ...state,
      ...payload,
    };
    saveData(newState);
    return newState;
  },
}, defaultState);
