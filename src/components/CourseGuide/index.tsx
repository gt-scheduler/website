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
      letter: 'Avg',
      percentage: 3.06
    },
    {
      letter: 'A',
      percentage: 3.06
    },
    {
      letter: 'B',
      percentage: 3.06
    },
    {
      letter: 'C',
      percentage: 3.06
    },
    {
      letter: 'D',
      percentage: 3.06
    },
    {
      letter: 'F',
      percentage: 3.06
    },
    {
      letter: 'W',
      percentage: 3.06
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
