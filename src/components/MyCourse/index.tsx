import React, { useContext, useCallback } from 'react';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import { Course as CourseBean } from '../../data/beans';
import { ScheduleContext } from '../../contexts';
import { classes } from '../../utils/misc';
import { ActionRow } from '..';
import { Action } from '../ActionRow';

import './stylesheet.scss';

export type MyCourseProps = {
  courseId: string;
  className?: string;
};

export default function MyCourse({
  courseId,
  className,
}: MyCourseProps): React.ReactElement | null {
  const [
    { oscar, colorMap, pinnedCrns, desiredCourses, excludedCrns },
    { patchSchedule },
  ] = useContext(ScheduleContext);
  const handleRemoveCourse = useCallback(
    (course: CourseBean) => {
      const newColorMap = { ...colorMap };
      delete newColorMap[course.id];

      patchSchedule({
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
    [desiredCourses, pinnedCrns, excludedCrns, colorMap, patchSchedule]
  );
  const course = oscar.findCourse(courseId);
  if (course == null) return null;
  const color = colorMap[course.id];
  const pinnedSections = course.sections.filter((section) =>
    pinnedCrns.includes(section.crn)
  );

  const myCourseActions: Action[] = [
    {
      icon: faTrash,
      onClick: (): void => handleRemoveCourse(course),
    },
  ];

  return (
    <div
      style={{
        backgroundColor: color,
      }}
      className={classes('MyCourse', 'default', className)}
      key={course.id}
    >
      <ActionRow
        actions={myCourseActions}
        label={[course.id, pinnedSections.map((section) => section.id)].join(
          ' '
        )}
      />
    </div>
  );
}
