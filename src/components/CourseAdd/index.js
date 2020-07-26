import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Course } from '../';
import { classes, getRandomColor, refineInstructionalMethodAttribute } from '../../utils';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { INSTRUCTIONAL_METHOD_ATTRIBUTES } from '../../constants';
import { TermContext } from '../../contexts';

export function CourseAdd({ className }) {
  const [
    { oscar, desiredCourses, excludedCrns, colorMap },
    { patchTermData },
  ] = useContext(TermContext);
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [attributes, setAttributes] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const handleChangeKeyword = useCallback(e => {
    let keyword = e.target.value.trim();
    const results = keyword.match(/^([A-Z]+)(\d.*)$/i);
    if (results) {
      const [, subject, number] = results;
      keyword = `${subject} ${number}`;
    }
    setKeyword(keyword);
  }, []);

  useEffect(() => {
    const courses = oscar.searchCourses(keyword, attributes)
      .filter((course) => !desiredCourses.includes(course.id));
    setCourses(courses);
    setActiveIndex(0);
  }, [oscar, keyword, attributes, desiredCourses]);

  const handleAddCourse = useCallback(course => {
    if (desiredCourses.includes(course.id)) return;
    const tbaCrns = course.sections
      .filter(section =>
        !section.meetings.length ||
        section.meetings.some(meeting => !meeting.days.length || !meeting.period),
      )
      .map((section) => section.crn);
    patchTermData({
      desiredCourses: [...desiredCourses, course.id],
      excludedCrns: [...excludedCrns, ...tbaCrns],
      colorMap: { ...colorMap, [course.id]: getRandomColor() },
    });
    setCourses([]);
    setKeyword('');
    inputRef.current.focus();
  }, [desiredCourses, excludedCrns, colorMap, inputRef, patchTermData]);

  const handleKeyDown = useCallback(e => {
    switch (e.key) {
      case 'Enter':
        const activeCourse = courses[activeIndex];
        if (activeCourse) {
          handleAddCourse(activeCourse);
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
  }, [courses, handleAddCourse, activeIndex]);

  const handleToggleAttribute = useCallback(attribute => {
    setAttributes(
      attributes.includes(attribute) ?
        attributes.filter(v => v !== attribute) :
        [...attributes, attribute],
    );
  }, [attributes]);

  const activeCourse = courses[activeIndex];

  return (
    <div className={classes('CourseAdd', className)}>
      <div className="add">
        <div className="primary">
          <FontAwesomeIcon className={classes('icon', courses.length && 'active')} fixedWidth icon={faPlus}/>
          <div className="keyword-wrapper">
            {
              activeCourse && (
                <div className={classes('keyword', 'autocomplete')}>
                  {activeCourse.id}
                </div>
              )
            }
            <input type="text"
                   ref={inputRef}
                   value={keyword}
                   onChange={handleChangeKeyword}
                   className="keyword"
                   placeholder="XX 0000"
                   onKeyDown={handleKeyDown}/>
          </div>
        </div>
        <div className="secondary">
          <div className={classes('attribute', attributes.length === 0 && 'active')}
               onClick={() => setAttributes([])}>
            All
          </div>
          {
            INSTRUCTIONAL_METHOD_ATTRIBUTES.map(attribute => (
              <div className={classes('attribute', attributes.includes(attribute) && 'active')} key={attribute}
                   onClick={() => handleToggleAttribute(attribute)}>
                {refineInstructionalMethodAttribute(attribute)}
              </div>
            ))
          }
        </div>
      </div>
      {
        courses.map(course => (
          <Course
            key={course.id}
            className={course === activeCourse && 'active'}
            courseId={course.id}
            pinnedCrns={[]}
            onAddCourse={() => handleAddCourse(course)}
          />
        ))
      }
    </div>
  );
}
