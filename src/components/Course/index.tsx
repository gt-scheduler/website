import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  faAngleDown,
  faAngleUp,
  faInfoCircle,
  faShareAlt,
  faPalette,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

import { classes, getContentClassName } from '../../utils';
import { ActionRow, Instructor, Palette, Prerequisite } from '..';
import { TermContext } from '../../contexts';
import { Course as CourseBean, Section } from '../../data/beans';
import { CourseGpa, CrawlerPrerequisites } from '../../types';
import { ErrorWithFields, softError } from '../../log';

import './stylesheet.scss';

export type CourseProps = {
  className?: string;
  courseId: string;
  onAddCourse?: () => void;
};

export default function Course({
  className,
  courseId,
  onAddCourse,
}: CourseProps): React.ReactElement | null {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [prereqOpen, setPrereqOpen] = useState<boolean>(false);
  const [paletteShown, setPaletteShown] = useState<boolean>(false);
  const [gpaMap, setGpaMap] = useState<CourseGpa | null>(null);
  const isSearching = Boolean(onAddCourse);
  const [
    { oscar, term, desiredCourses, pinnedCrns, excludedCrns, colorMap },
    { patchTermData },
  ] = useContext(TermContext);

  useEffect(() => {
    if (!isSearching) {
      const course = oscar.findCourse(courseId);
      if (course == null) return;
      course
        .fetchGpa()
        .then(setGpaMap)
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'error fetching course GPA',
              source: err,
              fields: {
                courseId,
                term: course.term,
              },
            })
          );
        });
    }
  }, [isSearching, oscar, courseId]);

  const handleRemoveCourse = useCallback(
    (course: CourseBean) => {
      const newColorMap = { ...colorMap };
      delete newColorMap[course.id];

      patchTermData({
        desiredCourses: desiredCourses.filter((id) => id !== course.id),
        pinnedCrns: pinnedCrns.filter(
          (crn) => !course.sections.some((section) => section.crn === crn)
        ),
        excludedCrns: excludedCrns.filter(
          (crn) => !course.sections.some((section) => section.crn === crn)
        ),
        colorMap: newColorMap,
      });
    },
    [desiredCourses, pinnedCrns, excludedCrns, colorMap, patchTermData]
  );

  const handleIncludeSections = useCallback(
    (sections: Section[]) => {
      const crns = sections.map((section) => section.crn);
      patchTermData({
        excludedCrns: excludedCrns.filter((crn) => !crns.includes(crn)),
      });
    },
    [excludedCrns, patchTermData]
  );

  const course = oscar.findCourse(courseId);
  if (course == null) return null;

  const color = colorMap[course.id];
  const contentClassName = color != null && getContentClassName(color);

  const hasPrereqs = oscar.version > 1;
  let prereqs: CrawlerPrerequisites | null = null;
  if (hasPrereqs) {
    prereqs = course.prereqs ?? [];
  }

  const instructorMap: Record<string, Section[] | undefined> = {};
  course.sections.forEach((section) => {
    const [primaryInstructor = 'Not Assigned'] = section.instructors;

    const instructorSections = instructorMap[primaryInstructor] ?? [];
    instructorSections.push(section);
    instructorMap[primaryInstructor] = instructorSections;
  });

  const instructors = Object.keys(instructorMap);
  const excludedInstructors = instructors.filter((instructor) => {
    const sections = instructorMap[instructor];
    if (sections == null) return false;
    return sections.every((section) => excludedCrns.includes(section.crn));
  });
  const includedInstructors = instructors.filter(
    (instructor) => !excludedInstructors.includes(instructor)
  );

  const prereqControl = (
    nextPrereqOpen: boolean,
    nextExpanded: boolean
  ): void => {
    setPrereqOpen(nextPrereqOpen);
    setExpanded(nextExpanded);
  };
  const prereqAction = {
    icon: faShareAlt,
    styling: { transform: 'rotate(90deg)' },
    onClick: (): void => {
      prereqControl(true, !prereqOpen ? true : !expanded);
    },
  };

  const infoAction = {
    icon: faInfoCircle,
    href:
      `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_` +
      `course_detail?cat_term_in=${term}&subj_code_in=` +
      `${course.subject}&crse_numb_in=${course.number}`,
  };

  const pinnedSections = course.sections.filter((section) =>
    pinnedCrns.includes(section.crn)
  );
  const totalCredits = pinnedSections.reduce(
    (credits, section) => credits + section.credits,
    0
  );

  return (
    <div
      className={classes('Course', contentClassName, 'default', className)}
      style={{ backgroundColor: color }}
      key={course.id}
    >
      <ActionRow
        label={[
          course.id,
          pinnedSections.map((section) => section.id).join(', '),
        ].join(' ')}
        actions={
          isSearching
            ? [
                { icon: faPlus, onClick: onAddCourse },
                hasPrereqs ? prereqAction : infoAction,
              ]
            : [
                {
                  icon: expanded ? faAngleUp : faAngleDown,
                  onClick: (): void => prereqControl(false, !expanded),
                },
                hasPrereqs ? prereqAction : infoAction,
                {
                  icon: faPalette,
                  onClick: (): void => setPaletteShown(!paletteShown),
                },
                {
                  icon: faTrash,
                  onClick: (): void => handleRemoveCourse(course),
                },
              ]
        }
      >
        <div className="course-row">
          <span className="course-title">{course.title}</span>
          <span className="section-crns">
            {pinnedSections.map((section) => section.crn).join(', ')}
          </span>
        </div>
        {!isSearching && (
          <div className="course-row">
            <span className="gpa">
              Course GPA:{' '}
              {gpaMap === null
                ? 'Loading...'
                : gpaMap.averageGpa
                ? gpaMap.averageGpa.toFixed(2)
                : 'N/A'}
            </span>
            {totalCredits > 0 && (
              <span className="credits">{totalCredits} Credits</span>
            )}
          </div>
        )}
        {paletteShown && (
          <Palette
            className="palette"
            onSelectColor={(col): void =>
              patchTermData({ colorMap: { ...colorMap, [courseId]: col } })
            }
            color={color ?? null}
            onMouseLeave={(): void => setPaletteShown(false)}
          />
        )}
      </ActionRow>
      {expanded && !prereqOpen && (
        <div className={classes('hover-container', 'nested')}>
          {includedInstructors.map((name) => {
            let instructorGpa: number | undefined = 0;
            if (gpaMap !== null) {
              instructorGpa = gpaMap[name];
            }
            return (
              <Instructor
                key={name}
                color={color}
                name={name}
                sections={instructorMap[name] ?? []}
                gpa={
                  gpaMap === null
                    ? 'Loading...'
                    : instructorGpa
                    ? instructorGpa.toFixed(2)
                    : 'N/A'
                }
              />
            );
          })}
          {excludedInstructors.length > 0 && (
            <div className="excluded-instructor-container">
              {excludedInstructors.map((name) => (
                <span
                  className="excluded-instructor"
                  key={name}
                  onClick={(): void => {
                    const instructorSections = instructorMap[name];
                    if (instructorSections == null) return;
                    handleIncludeSections(instructorSections);
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {expanded && prereqOpen && prereqs !== null && (
        <Prerequisite course={course} prereqs={prereqs} />
      )}
    </div>
  );
}
