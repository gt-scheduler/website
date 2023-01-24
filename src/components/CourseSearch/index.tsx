import React, {
  ChangeEvent,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { classes, getRandomColor } from '../../utils/misc';
import { Course, CourseFilter } from '..';
import { ScheduleContext } from '../../contexts';
import { Course as CourseBean, Section } from '../../data/beans';
import {
  ASYNC_DELIVERY_MODE,
  CAMPUSES,
  COURSE_CARD_TYPES,
  DELIVERY_MODES,
} from '../../constants';
import CourseFilterByCreditHours from '../CourseFilterByCreditHours';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export type CourseSearchProps = {
  className?: string;
  onShow: (courseToAdd: CourseBean) => void;
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

function doesFilterMatchSection(section: Section, filter: SortFilter): boolean {
  return Object.entries(filter).every(([key, tags]) => {
    if (!isSortKey(key)) return true;
    if (key === 'days')
      return section.meetings.some((meeting) => {
        const sortValue = meeting[key];
        return sortValue.some((day) => tags.includes(day));
      });
    if (key === 'credits') {
      const sortValue = section[key];
      return tags.includes(`${sortValue}`);
    }

    if (key === 'startTime') {
      const startTimeLimitStr = filter.startTime[0];
      if (startTimeLimitStr) {
        return section.meetings.some((meeting) => {
          const startTime = meeting.period?.start;
          const startTimeLimit = parseInt(startTimeLimitStr, 10);
          return startTime && startTime >= startTimeLimit;
        });
      }
      return true;
    }

    if (key === 'endTime') {
      const endTimeLimitStr = filter.endTime[0];
      if (endTimeLimitStr) {
        return section.meetings.some((meeting) => {
          const endTime = meeting.period?.end;
          const endTimeLimit = parseInt(endTimeLimitStr, 10);
          return endTime && endTime <= endTimeLimit;
        });
      }
      return true;
    }

    // TODO: Implement filter
    if (key === 'courseLevel') {
      return true;
    }

    const sortValue = section[key];
    if (sortValue == null) return false;
    return tags.length === 0 || tags.includes(sortValue);
  });
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

    if (key === 'startTime') {
      const startTimeLimitStr = filter.startTime[0];
      if (startTimeLimitStr) {
        return course.sections.some((section) => {
          return section.meetings.some((meeting) => {
            const startTime = meeting.period?.start;
            const startTimeLimit = parseInt(startTimeLimitStr, 10);
            return startTime && startTime >= startTimeLimit;
          });
        });
      }
      return true;
    }

    if (key === 'endTime') {
      const endTimeLimitStr = filter.endTime[0];
      if (endTimeLimitStr) {
        return course.sections.some((section) => {
          return section.meetings.some((meeting) => {
            const endTime = meeting.period?.end;
            const endTimeLimit = parseInt(endTimeLimitStr, 10);
            return endTime && endTime <= endTimeLimit;
          });
        });
      }
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

export default function CourseSearch({
  onShow,
}: CourseSearchProps): React.ReactElement {
  const [{ oscar, desiredCourses, excludedCrns, colorMap }, { patchSchedule }] =
    useContext(ScheduleContext);
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

    return oscar.courses.filter((course) => {
      const keywordMatch =
        course.subject === subject && course.number.startsWith(number);
      const filterMatch = doesFilterMatchCourse(course, filter);
      return keywordMatch && filterMatch;
    });
    // .filter((course) => !desiredCourses.includes(course.id));
  }, [oscar, keyword, filter]);

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

  const handleToggleFilterDropdown = useCallback(
    (key: SortKey, tagArr: string[]) => {
      setFilter({
        ...filter,
        [key]: tagArr,
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

  // function doesFilterMatchSection(
  //   section: Section,
  //   filter: SortFilter
  // ): boolean {
  //   return Object.entries(filter).every(([key, tags]) => {
  //     if (tags.length === 0) return true;
  //     if (!isSortKey(key)) return true;

  //     const sortValue = section[key];
  //     if (sortValue == null) return false;

  //     return tags.includes(sortValue);
  //   });
  // }

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
                onKeyDown={handleKeyDown}
                className="keyword"
              />
            </div>
          </div>
          <CourseFilterByCreditHours
            key="creditHours"
            onReset={(key: string): void => handleResetFilter(key)}
            onToggle={(key, tag): void => handleToggleFilter(key, tag)}
            onToggleDropdown={(key, tags): void =>
              handleToggleFilterDropdown(key, tags)
            }
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
            onShowInfo={(): void => onShow(course)}
            courseCardType={COURSE_CARD_TYPES.CourseSearch}
          />
        ))}
      </div>
    </>
  );
}
