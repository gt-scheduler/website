import { useCallback, useContext } from 'react';

import { ScheduleContext } from '../contexts';
import { ASYNC_DELIVERY_MODE } from '../constants';
import { getRandomColor } from '../utils/misc';

/**
 * Hook to import courses from a comma-delimited string of course names.
 * This is useful for integrating with other GT applications like GT Roadmap.
 *
 * @returns A function that accepts a comma-delimited string of course names
 * and adds them to the schedule's desiredCourses list.
 *
 * @example
 * const importCourses = useImportCourses();
 * importCourses('CS 1331,MATH 3012,CS 3210');
 */
export default function useImportCourses(): (courseString: string) => void {
  const [{ oscar, desiredCourses, excludedCrns, colorMap }, { patchSchedule }] =
    useContext(ScheduleContext);

  const importCourses = useCallback(
    (courseString: string) => {
      // Parse the comma-delimited string into individual course names
      const courseNames = courseString
        .split(',')
        .map((name) => name.trim().toUpperCase())
        .filter((name) => name.length > 0);

      const newDesiredCourses: string[] = [];
      const newExcludedCrns: string[] = [];
      const newColorMap: Record<string, string> = {};

      // Process each course name
      courseNames.forEach((courseName) => {
        // Normalize the course name format (e.g., "CS1331" -> "CS 1331")
        // Mitigate for different formatting of course string
        let normalizedName = courseName;
        const results = /^([A-Z]+)(\d.*)$/i.exec(courseName);
        if (results != null) {
          const [, subject, number] = results as unknown as [
            string,
            string,
            string
          ];
          normalizedName = `${subject} ${number}`;
        }

        // Search for the course in oscar.courses
        const course = oscar.courses.find((c) => c.id === normalizedName);

        // If the course is found and not already in desiredCourses, add it
        if (course && !desiredCourses.includes(course.id)) {
          newDesiredCourses.push(course.id);

          // Exclude sections that don't have decided times or don't match filters
          // (following the same logic as CourseAdd)
          const toBeExcludedCrns = course.sections
            .filter((section) => {
              const timeDecided =
                section.deliveryMode === ASYNC_DELIVERY_MODE ||
                (section.meetings.length &&
                  section.meetings.every(
                    (meeting) => meeting.days.length && meeting.period
                  ));
              return !timeDecided;
            })
            .map((section) => section.crn);

          newExcludedCrns.push(...toBeExcludedCrns);

          // Assign a random color to the course
          newColorMap[course.id] = getRandomColor();
        }
      });

      // Update the schedule if any courses were found
      if (newDesiredCourses.length > 0) {
        patchSchedule({
          desiredCourses: [...desiredCourses, ...newDesiredCourses],
          excludedCrns: [...excludedCrns, ...newExcludedCrns],
          colorMap: { ...colorMap, ...newColorMap },
        });
      }
    },
    [oscar, desiredCourses, excludedCrns, colorMap, patchSchedule]
  );

  return importCourses;
}
