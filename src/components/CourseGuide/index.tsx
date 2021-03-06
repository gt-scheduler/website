import React from 'react';

import CourseCatalogHeader from '../CourseCatalogHeader';

/**
 * Renders a nav drawer and the overlay when it is open
 */
export default function CourseGuide() {
  const currentCourse = 'CS 2340: Object System Design';
  const description =
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.';

  const creditHours = 3;
  const prerequisite =
    'CS 3510 or CS 3511 and MATH 3012 OR MATH 3022 and MATH2399';
  const courseGPA = [
    {
      Letter: 'Avg',
      Percentage: 3.06
    },
    {
      Letter: 'A',
      Percentage: 3.06
    },
    {
      Letter: 'B',
      Percentage: 3.06
    },
    {
      Letter: 'C',
      Percentage: 3.06
    },
    {
      Letter: 'D',
      Percentage: 3.06
    },
    {
      Letter: 'F',
      Percentage: 3.06
    },
    {
      Letter: 'W',
      Percentage: 3.06
    }
  ];

  return (
    <>
      <CourseCatalogHeader
        currentCourse={currentCourse}
        description={description}
        creditHours={creditHours}
        prerequisite={prerequisite}
        courseGPA={courseGPA}
      />
    </>
  );
}
