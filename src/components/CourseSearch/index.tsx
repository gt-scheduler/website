import React, {
  ChangeEvent,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { classes } from '../../utils/misc';
import { Course, CourseFilter } from '..';
import { ScheduleContext } from '../../contexts';
import { Course as CourseBean } from '../../data/beans';
import { CAMPUSES, DELIVERY_MODES } from '../../constants';
import CourseFilterByCreditHours from '../CourseFilterByCreditHours';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export type CourseAddProps = {
  className?: string;
};

export type SortKey =
  | 'deliveryMode'
  | 'campus'
  | 'credits'
  | 'days'
  | 'courseLevel'
  | 'startTime'
  | 'endTime';

export type SortFilter = {
  [sortKey in SortKey]: string[];
};

function isSortKey(sortKey: string): sortKey is SortKey {
  switch (sortKey) {
    case 'deliveryMode':
    case 'campus':
    case 'credits':
    case 'days':
    case 'courseLevel':
    case 'startTime':
    case 'endTime':
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
    if (key === 'days')
      return (
        tags.length === 0 ||
        course.sections.some((section) => {
          return section.meetings.some((meeting) => {
            const sortValue = meeting[key];
            return sortValue.some((day) => tags.includes(day));
          });
        })
      );
    if (key === 'credits')
      return (
        tags.length === 0 ||
        course.sections.some((section) => {
          const sortValue = section[key];
          return tags.includes(`${sortValue}`);
        })
      );

    // TODO: Implement filter
    if (key === 'startTime') {
      return true;
    }

    // TODO: Implement filter
    if (key === 'endTime') {
      return true;
    }

    // TODO: Implement filter
    if (key === 'courseLevel') {
      return true;
    }

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

export default function CourseSearch(): React.ReactElement {
  const [{ oscar, desiredCourses }] = useContext(ScheduleContext);
  // const [{ oscar, desiredCourses,
  //          excludedCrns, colorMap }, { patchSchedule }] =
  // useContext(ScheduleContext);
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<SortFilter>({
    deliveryMode: [],
    campus: [],
    credits: [],
    days: [],
    startTime: [],
    endTime: [],
    courseLevel: [],
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseBean[]>([]);

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
    (key) => {
      setFilter({
        ...filter,
        [key]: [],
      });
    },
    [filter]
  );

  const handleAddCourse = useCallback(
    (course: CourseBean) => {
      // handler logic here
      // need to populate the first and third column over here
      setSelectedCourse([...selectedCourse, course]);
    },
    [selectedCourse]
    // [filter, desiredCourses, excludedCrns, colorMap,
    //  inputRef, patchSchedule, selectedCourse]
  );
  const activeCourse = courses[activeIndex];

  return (
    <>
      <div className="CourseSearch">
        <div className="add">
          <div className="primary">
            <FontAwesomeIcon className="icon" fixedWidth icon={faSearch} />
            <div className="keyword-wrapper">
              {activeCourse && (
                <div className={classes('keyword', 'autocomplete')}>
                  {activeCourse.id}
                </div>
              )}
              <input
                type="text"
                placeholder="Subject or course number"
                ref={inputRef}
                value={keyword}
                onChange={handleChangeKeyword}
                className="keyword"
              />
            </div>
          </div>
          <CourseFilterByCreditHours
            key="creditHours"
            onReset={(key: string): void => handleResetFilter(key)}
            onToggle={(key, tag): void => handleToggleFilter(key, tag)}
            filter={filter}
          />
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
        {courses.map((course) => (
          <Course
            key={course.id}
            className={classes(course === activeCourse && 'active')}
            courseId={course.id}
            onAddCourse={(): void => handleAddCourse(course)}
          />
        ))}
      </div>
    </>
  );
}
