import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { Course, CourseFilter } from '..';
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
    campus: [],
    creditHoursClassTime: []
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

    return oscar.courses
      .filter((course) => {
        const keywordMatch =
          course.subject === subject && course.number.startsWith(number);
        const filterMatch = Object.entries(filter).every(
          ([key, tags]) =>
            tags.length === 0 ||
            course.sections.some((section) => tags.includes(section[key]))
        );
        return keywordMatch && filterMatch;
      })
      .filter((course) => !desiredCourses.includes(course.id));
  }, [oscar, keyword, filter, desiredCourses]);

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
        {[
          [
            'Credit Hours & Class Time',
            'creditHoursClassTime',
            CREDIT_HOURS_CLASS_TIME
          ],
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
