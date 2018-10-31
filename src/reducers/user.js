import { combineActions, createAction, handleActions } from 'redux-actions';
import Cookies from 'js-cookie';

const prefix = 'USER';

const setDesiredCourses = createAction(`${prefix}/SET_DESIRED_COURSES`, desiredCourses => ({ desiredCourses }));
const setPinnedCrns = createAction(`${prefix}/SET_PINNED_CRNS`, pinnedCrns => ({ pinnedCrns }));
const setExcludedCrns = createAction(`${prefix}/SET_EXCLUDED_CRNS`, excludedCrns => ({ excludedCrns }));
const setColorMap = createAction(`${prefix}/SET_COLOR_MAP`, colorMap => ({ colorMap }));

export const actions = {
  setDesiredCourses,
  setPinnedCrns,
  setExcludedCrns,
  setColorMap,
};

const saveData = ({ desiredCourses = [], pinnedCrns = [], excludedCrns = [], colorMap = {} }) => {
  Cookies.set('data', JSON.stringify({ desiredCourses, pinnedCrns, excludedCrns, colorMap }), { expires: 365 });
};

const loadData = () => {
  let json = null;
  try {
    json = JSON.parse(Cookies.get('data'));
  } catch (e) {
    json = {};
  }
  const { desiredCourses = [], pinnedCrns = [], excludedCrns = [], colorMap = {} } = json;
  return { desiredCourses, pinnedCrns, excludedCrns, colorMap };
};

const defaultState = loadData();

export default handleActions({
  [combineActions(
    setDesiredCourses,
    setPinnedCrns,
    setExcludedCrns,
    setColorMap,
  )]: (state, { payload }) => {
    const newState = {
      ...state,
      ...payload,
    };
    saveData(newState);
    return newState;
  },
}, defaultState);
