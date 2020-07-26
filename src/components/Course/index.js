import React, { useCallback, useContext, useEffect, useState } from 'react';
import { faAngleDown, faAngleUp, faInfoCircle, faPalette, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { classes, getContentClassName } from '../../utils';
import { ActionRow, Instructor, Palette } from '../';
import './stylesheet.scss';
import { TermContext } from '../../contexts';

export function Course({ className, courseId, onAddCourse }) {
  const [expanded, setExpanded] = useState(false);
  const [paletteShown, setPaletteShown] = useState(false);
  const [gpaMap, setGpaMap] = useState({});
  const isSearching = Boolean(onAddCourse);
  const [
    { oscar, term, desiredCourses, pinnedCrns, excludedCrns, colorMap },
    { patchTermData },
  ] = useContext(TermContext);

  useEffect(() => {
    if (!isSearching) {
      const course = oscar.findCourse(courseId);
      course.fetchGpa().then(setGpaMap);
    }
  }, [isSearching, oscar, courseId]);

  const handleRemoveCourse = useCallback(course => {
    patchTermData({
      desiredCourses: desiredCourses.filter(courseId => courseId !== course.id),
      pinnedCrns: pinnedCrns.filter(crn => !course.sections.some(section => section.crn === crn)),
      excludedCrns: excludedCrns.filter(crn => !course.sections.some(section => section.crn === crn)),
      colorMap: { ...colorMap, [course.id]: undefined },
    });
  }, [desiredCourses, pinnedCrns, excludedCrns, colorMap, patchTermData]);

  const handleIncludeSections = useCallback(sections => {
    const crns = sections.map(section => section.crn);
    patchTermData({
      excludedCrns: excludedCrns.filter(crn => !crns.includes(crn)),
    });
  }, [excludedCrns, patchTermData]);

  const course = oscar.findCourse(courseId);
  const color = colorMap[course.id];
  const contentClassName = color && getContentClassName(color);

  const instructorMap = {};
  course.sections.forEach(section => {
    const [primaryInstructor = 'Not Assigned'] = section.instructors;
    if (!(primaryInstructor in instructorMap)) {
      instructorMap[primaryInstructor] = [];
    }
    instructorMap[primaryInstructor].push(section);
  });

  const instructors = Object.keys(instructorMap);
  const excludedInstructors = instructors.filter(instructor => {
    const sections = instructorMap[instructor];
    return sections.every(section => excludedCrns.includes(section.crn));
  });
  const includedInstructors = instructors.filter(instructor => !excludedInstructors.includes(instructor));

  const infoAction = {
    icon: faInfoCircle,
    href: `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_course_detail?cat_term_in=${term}&subj_code_in=${course.subject}&crse_numb_in=${course.number}`,
  };

  const pinnedSections = course.sections.filter(section => pinnedCrns.includes(section.crn));
  const totalCredits = pinnedSections.reduce((credits, section) => credits + section.credits, 0);

  return (
    <div className={classes('Course', contentClassName, 'default', className)}
         style={{ backgroundColor: color }}
         key={course.id}>
      <ActionRow label={[course.id, pinnedSections.map(section => section.id).join(', ')].join(' ')}
                 actions={isSearching ? [
                   { icon: faPlus, onClick: onAddCourse },
                   infoAction,
                 ] : [
                   { icon: expanded ? faAngleUp : faAngleDown, onClick: () => setExpanded(!expanded) },
                   infoAction,
                   { icon: faPalette, onClick: () => setPaletteShown(!paletteShown) },
                   { icon: faTrash, onClick: () => handleRemoveCourse(course) },
                 ]}>
        <div className="course-row">
          <span className="course-title" dangerouslySetInnerHTML={{ __html: course.title }}/>
          <span className="section-crns">
              {pinnedSections.map(section => section.crn).join(', ')}
            </span>
        </div>
        {
          !isSearching && (
            <div className="course-row">
                <span className="gpa">
                  Course GPA: {gpaMap.averageGpa || 'N/A'}
                </span>
              {
                totalCredits > 0 && (
                  <span className="credits">
                      {totalCredits} Credits
                    </span>
                )
              }
            </div>
          )
        }
        {
          paletteShown &&
          <Palette className="palette"
                   onSelectColor={color => patchTermData({ colorMap: { ...colorMap, [courseId]: color } })}
                   color={color} onMouseLeave={() => setPaletteShown(false)}/>
        }
      </ActionRow>
      {
        expanded &&
        <div className={classes('instructor-container', 'nested')}>
          {
            includedInstructors.map(name => (
              <Instructor key={name} color={color} name={name}
                          sections={instructorMap[name]} gpa={gpaMap[name]}/>
            ))
          }
          {
            excludedInstructors.length > 0 &&
            <div className="excluded-instructor-container">
              {
                excludedInstructors.map(name => (
                  <span className="excluded-instructor" key={name}
                        onClick={() => handleIncludeSections(instructorMap[name])}>
                      {name}
                    </span>
                ))
              }
            </div>
          }
        </div>
      }
    </div>
  );
}
