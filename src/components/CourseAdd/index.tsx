import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { Course, CourseFilter } from '..';
import { classes, getRandomColor } from '../../utils/misc';
import { ASYNC_DELIVERY_MODE, CAMPUSES, DELIVERY_MODES } from '../../constants';
import { ScheduleContext } from '../../contexts';
import { Course as CourseBean, Section } from '../../data/beans';

import './stylesheet.scss';

export type CourseAddProps = {
  className?: string;
};

type SortKey = 'deliveryMode' | 'campus';

type SortFilter = {
  [sortKey in SortKey]: string[];
};

function isSortKey(sortKey: string): sortKey is SortKey {
  switch (sortKey) {
    case 'deliveryMode':
    case 'campus':
      return true;
    default:
      return false;
  }
}

function doesFilterMatchCourse(
  course: CourseBean,
  filter: SortFilter
): boolean {
  return Object.entries(filter).every(([key, tags]) => {
    if (!isSortKey(key)) return true;

    return (
      tags.length === 0 ||
      course.sections.some((section) => {
        const sortValue = section[key];
        if (sortValue == null) return false;

        return tags.includes(sortValue);
      })
    );
  });
}

function doesFilterMatchSection(section: Section, filter: SortFilter): boolean {
  return Object.entries(filter).every(([key, tags]) => {
    if (tags.length === 0) return true;
    if (!isSortKey(key)) return true;

    const sortValue = section[key];
    if (sortValue == null) return false;

    return tags.includes(sortValue);
  });
}

export default function CourseAdd({
  className,
}: CourseAddProps): React.ReactElement {
  const [{ oscar, desiredCourses, excludedCrns, colorMap }, { patchSchedule }] =
    useContext(ScheduleContext);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<SortFilter>({
    deliveryMode: [],
    campus: [],
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChangeKeyword = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value.trim();
      const results = /^([A-Z]+)(\d.*)$/i.exec(input);
      if (results != null) {
        const [, subject, number] = results as unknown as [
          string,
          string,
          string
        ];
        input = `${subject} ${number}`;
      }
      setKeyword(input);
    },
    []
  );

  const courses = useMemo(() => {
    const results = /^([A-Z]+) ?((\d.*)?)$/i.exec(keyword.toUpperCase());
    if (!results) {
      return [];
    }
    const [, subject, number] = results as unknown as [string, string, string];

    setActiveIndex(0);

    return oscar.courses
      .filter((course) => {
        const keywordMatch =
          course.subject === subject && course.number.startsWith(number);
        const filterMatch = doesFilterMatchCourse(course, filter);
        return keywordMatch && filterMatch;
      })
      .filter((course) => !desiredCourses.includes(course.id));
  }, [oscar, keyword, filter, desiredCourses]);

  const handleAddCourse = useCallback(
    (course: CourseBean) => {
      if (desiredCourses.includes(course.id)) return;
      const toBeExcludedCrns = course.sections
        .filter((section) => {
          const timeDecided =
            section.deliveryMode === ASYNC_DELIVERY_MODE ||
            (section.meetings.length &&
              section.meetings.every(
                (meeting) => meeting.days.length && meeting.period
              ));
          const filterMatch = doesFilterMatchSection(section, filter);
          return !timeDecided || !filterMatch;
        })
        .map((section) => section.crn);
      patchSchedule({
        desiredCourses: [...desiredCourses, course.id],
        excludedCrns: [...excludedCrns, ...toBeExcludedCrns],
        colorMap: { ...colorMap, [course.id]: getRandomColor() },
      });
      setKeyword('');
      inputRef.current?.focus();
    },
    [filter, desiredCourses, excludedCrns, colorMap, inputRef, patchSchedule]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter': {
          const course = courses[activeIndex];
          if (course != null) {
            handleAddCourse(course);
          }
          break;
        }
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
    (key: SortKey, tag: string) => {
      const tags = filter[key];
      setFilter({
        ...filter,
        [key]: tags.includes(tag)
          ? tags.filter((v) => v !== tag)
          : [...tags, tag],
      });
    },
    [filter]
  );

  const handleResetFilter = useCallback(
    (key: string) => {
      setFilter({
        ...filter,
        [key]: [],
      });
    },
    [filter]
  );

  const activeCourse = courses[activeIndex];

  return (
    <div className={classes('CourseAdd', className)}>
      <div className="add">
        <div className="primary">
          <FontAwesomeIcon
            className={classes('icon', courses.length > 0 && 'active')}
            fixedWidth
            icon={faPlus}
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
              placeholder="XX 0000"
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
        {[
          ['Delivery Mode', 'deliveryMode', DELIVERY_MODES] as const,
          ['Campus', 'campus', CAMPUSES] as const,
        ].map(([name, property, labels]) => (
          <CourseFilter
            key={property}
            name={name}
            labels={labels}
            selectedTags={filter[property]}
            onReset={(): void => handleResetFilter(property)}
            onToggle={(tag): void => handleToggleFilter(property, tag)}
          />
        ))}
      </div>
      {courses.length > 0 ? (
        courses.map((course) => (
          <Course
            key={course.id}
            className={classes(course === activeCourse && 'active')}
            courseId={course.id}
            onAddCourse={(): void => handleAddCourse(course)}
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
