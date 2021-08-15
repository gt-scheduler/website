import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { Course, CourseFilter, CourseFilterNested } from '..';
import { classes, getRandomColor } from '../../utils';
import './stylesheet.scss';
import {
  ASYNC_DELIVERY_MODE,
  CAMPUSES,
  DELIVERY_MODES,
  CREDIT_HOURS_CLASS_TIME
} from '../../constants';
import { TermContext } from '../../contexts';

export default function CourseAddCatalog({ className }) {
  const [
    { oscar, desiredCourses, excludedCrns, colorMap },
    { patchTermData }
  ] = useContext(TermContext);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState({
    deliveryMode: [],
    campus: []
  });
  const [chctFilter, setChctFilter] = useState({
    credits: [],
    days: [],
    courseLevel: [],
    startsAfter: 'Any time',
    endsBefore: 'Any time'
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const handleChangeKeyword = useCallback((e) => {
    let input = e.target.value.trim();
    const results = input.match(/^([A-Z]+)(\d.*)$/i);
    if (results) {
      const [, subject, number] = results;
      input = `${subject} ${number}`;
    }
    setKeyword(input);
  }, []);

  const courses = useMemo(() => {
    const results = /^([A-Z]+) ?((\d.*)?)$/i.exec(keyword.toUpperCase());
    if (!results) {
      return [];
    }
    const [, subject, number] = results;

    setActiveIndex(0);

    const arrayFilters = Object.entries(chctFilter)
      .concat(Object.entries(filter))
      .reduce((o, [k, v]) => {
        if (typeof v === 'object' && k !== 'courseLevel') {
          if (k === 'credits') {
            o[k] = v.map((str) => parseInt(str, 10));
            if (o[k].includes(4)) {
              o[k] = o[k].concat([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
            }
          } else {
            o[k] = v;
          }
        }
        return o;
      }, {});

    let classNumberLowerLimit = 0;
    let classNumberUpperLimit = 10000;
    if (chctFilter.courseLevel.length === 1) {
      if (chctFilter.courseLevel[0] === 'Undergraduate') {
        classNumberUpperLimit = 6000;
      } else {
        classNumberLowerLimit = 5999;
      }
    }

    let classStartsAfter = 0;
    let classEndsBefore = 2000;
    if (chctFilter.startsAfter !== 'Any time') {
      classStartsAfter = parseInt(chctFilter.startsAfter, 10);
    }
    if (chctFilter.endsBefore !== 'Any time') {
      classEndsBefore = parseInt(chctFilter.endsBefore, 10);
    }

    return oscar.courses
      .filter((course) => {
        const keywordMatch =
          course.subject === subject && course.number.startsWith(number);
        const courseLevelMatch =
          course.number < classNumberUpperLimit &&
          course.number > classNumberLowerLimit;
        const timeMatch = course.sections.some((section) => {
          return section.meetings.some((m) => {
            if (m.period && m.period.start && m.period.end) {
              return (
                m.period.start >= classStartsAfter &&
                m.period.end <= classEndsBefore
              );
            }
            return false;
          });
        });
        const filterMatch = Object.entries(arrayFilters).every(
          ([key, tags]) =>
            tags.length === 0 ||
            course.sections.some((section) => {
              return (
                tags.includes(section[key]) ||
                section.meetings.some((m) => {
                  if (m[key]) {
                    return m[key].every((d) => tags.includes(d));
                  }
                  return false;
                })
              );
            })
        );
        return keywordMatch && filterMatch && courseLevelMatch && timeMatch;
      })
      .filter((course) => !desiredCourses.includes(course.id));
  }, [oscar, keyword, filter, chctFilter, desiredCourses]);

  const handleAddCourse = useCallback(
    (course) => {
      if (desiredCourses.includes(course.id)) return;
      const toBeExcludedCrns = course.sections
        .filter((section) => {
          const timeDecided =
            section.deliveryMode === ASYNC_DELIVERY_MODE ||
            (section.meetings.length &&
              section.meetings.every(
                (meeting) => meeting.days.length && meeting.period
              ));
          const filterMatch = Object.entries(filter).every(
            ([key, tags]) => tags.length === 0 || tags.includes(section[key])
          );
          return !timeDecided || !filterMatch;
        })
        .map((section) => section.crn);
      patchTermData({
        desiredCourses: [...desiredCourses, course.id],
        excludedCrns: [...excludedCrns, ...toBeExcludedCrns],
        colorMap: { ...colorMap, [course.id]: getRandomColor() }
      });
      setKeyword('');
      inputRef.current.focus();
    },
    [filter, desiredCourses, excludedCrns, colorMap, inputRef, patchTermData]
  );

  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case 'Enter':
          if (courses[activeIndex]) {
            handleAddCourse(courses[activeIndex]);
          }
          break;
        case 'ArrowDown':
          setActiveIndex(Math.min(activeIndex + 1, courses.length - 1));
          break;
        case 'ArrowUp':
          setActiveIndex(Math.max(activeIndex - 1, 0));
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [courses, handleAddCourse, activeIndex]
  );

  const handleToggleFilter = useCallback(
    (key, tag) => {
      const tags = filter[key];
      setFilter({
        ...filter,
        [key]: tags.includes(tag)
          ? tags.filter((v) => v !== tag)
          : [...tags, tag]
      });
    },
    [filter]
  );

  const handleResetFilter = useCallback(
    (key) => {
      setFilter({
        ...filter,
        [key]: []
      });
    },
    [filter]
  );

  const activeCourse = courses[activeIndex];

  return (
    <div className={classes('CourseAddCatalog', className)}>
      <div className="add">
        <div className="primary">
          <FontAwesomeIcon
            className={classes('icon', courses.length && 'active')}
            fixedWidth
            icon={faSearch}
          />
          <div className="keyword-wrapper">
            {activeCourse && (
              <div className={classes('keyword', 'autocomplete')}>
                {activeCourse.id}
              </div>
            )}
            <input
              type="text"
              ref={inputRef}
              value={keyword}
              onChange={handleChangeKeyword}
              className="keyword"
              placeholder="Subject or course number"
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
        <CourseFilterNested
          key="creditHoursClassTime"
          name="Credit Hours & Class Time"
          data={CREDIT_HOURS_CLASS_TIME}
          filters={chctFilter}
          setFilters={setChctFilter}
        />
        {[
          ['Delivery Mode', 'deliveryMode', DELIVERY_MODES],
          ['Campus', 'campus', CAMPUSES]
        ].map(([name, property, labels]) => (
          <CourseFilter
            key={property}
            name={name}
            labels={labels}
            selectedTags={filter[property]}
            onReset={() => handleResetFilter(property)}
            onToggle={(tag) => handleToggleFilter(property, tag)}
          />
        ))}
      </div>
      {courses.length > 0 ? (
        courses.map((course) => (
          <Course
            key={course.id}
            className={course === activeCourse && 'active'}
            courseId={course.id}
            pinnedCrns={[]}
            onAddCourse={() => handleAddCourse(course)}
          />
        ))
      ) : (
        <div className="disclaimer">
          Disclaimer: GT Scheduler should be used as general reference only, and
          users are solely responsible for ensuring any information including
          registration restrictions.
        </div>
      )}
    </div>
  );
}
