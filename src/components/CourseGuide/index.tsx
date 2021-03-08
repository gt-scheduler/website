import React from 'react';

import CourseCatalogHeader from '../CourseCatalogHeader';

export default function CourseGuide() {
  const currentCourse = 'CS 2340: Objects and Design';
  const description =
    'Object-oriented programming methods for dealing with large programs. Focus on quality processes, effective debugging techniques, and testing to assure a quality product.';

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
