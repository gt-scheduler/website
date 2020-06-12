import { combineActions, createAction, handleActions } from 'redux-actions';
import Cookies from 'js-cookie';
import { getRandomColor } from '../utils';

const prefix = 'USER';

const setTerm = createAction(`${prefix}/SET_TERM`, term => loadData(term));
const setDesiredCourses = createAction(
  `${prefix}/SET_DESIRED_COURSES`,
  desiredCourses => ({ desiredCourses })
);
const setPinnedCrns = createAction(`${prefix}/SET_PINNED_CRNS`, pinnedCrns => ({
  pinnedCrns,
}));
const setExcludedCrns = createAction(
  `${prefix}/SET_EXCLUDED_CRNS`,
  excludedCrns => ({ excludedCrns })
);
const setColorMap = createAction(`${prefix}/SET_COLOR_MAP`, colorMap => ({
  colorMap,
}));
const setSortingOptionIndex = createAction(
  `${prefix}/SET_SORTING_OPTION_INDEX`,
  sortingOptionIndex => ({ sortingOptionIndex })
);

export const actions = {
  setTerm,
  setDesiredCourses,
  setPinnedCrns,
  setExcludedCrns,
  setColorMap,
  setSortingOptionIndex,
};

const saveData = ({
  term,
  desiredCourses = [],
  pinnedCrns = [],
  excludedCrns = [],
  colorMap = {},
  sortingOptionIndex = 0,
}) => {
  Cookies.set('term', term);
  Cookies.set(
    term,
    JSON.stringify({
      desiredCourses,
      pinnedCrns,
      excludedCrns,
      colorMap,
      sortingOptionIndex,
    }),
    { expires: 365 }
  );
};

const loadData = (term = Cookies.get('term')) => {
  let json = null;
  try {
    json = JSON.parse(Cookies.get(term));
  } catch (e) {
    json = {};
  }
  const {
    desiredCourses = [],
    pinnedCrns = [],
    excludedCrns = [],
    colorMap = {},
    sortingOptionIndex = 0,
  } = json;
  desiredCourses.forEach(courseId => {
    if (!(courseId in colorMap)) {
      colorMap[courseId] = getRandomColor();
    }
  });
  return {
    term,
    desiredCourses,
    pinnedCrns,
    excludedCrns,
    colorMap,
    sortingOptionIndex,
  };
};

(function migrate201902() {
  const deprecatedData = Cookies.get('data');
  if (deprecatedData) {
    Cookies.set('term', '201902');
    Cookies.set('201902', deprecatedData);
    Cookies.remove('data');
  }
})();
const defaultState = loadData();

export default handleActions(
  {
    [combineActions(
      setTerm,
      setDesiredCourses,
      setPinnedCrns,
      setExcludedCrns,
      setColorMap,
      setSortingOptionIndex
    )]: (state, { payload }) => {
      const newState = {
        ...state,
        ...payload,
      };
      saveData(newState);
      return newState;
    },
  },
  defaultState
);
