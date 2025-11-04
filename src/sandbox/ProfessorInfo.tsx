import React, { useContext } from 'react';

import { Breadcrumb, ProfessorInfoCard } from '../components';
import { BreadcrumbItem } from '../components/Breadcrumb';
import MetricsCard from '../components/MetricsCard';
import { ScheduleContext } from '../contexts';

export default function ProfessorInfo(): React.ReactElement {
  const breadcrumbItem1: BreadcrumbItem = {
    label: 'Course Details',
    link: 'https://en.wikipedia.org/wiki/Website',
  };
  const breadcrumbItem2: BreadcrumbItem = { label: 'LMC 3705 Section Details' };
  const breadcrumbsList = [breadcrumbItem1, breadcrumbItem2];

  const metrics = [
    { label: 'Overall Rating', value: '3.91/5' },
    { label: 'Course GPA', value: '3.91' },
    { label: 'Level of Difficulty', value: '3.4/5' },
    { label: 'Course GPA', value: '14.5', unit: 'hrs/week' },
  ];

  const [{ oscar }] = useContext(ScheduleContext);
  const professorName = 'Frederic Faulkner';
  const course = oscar.findCourse('CS 1332');

  return (
    <div>
      <Breadcrumb items={breadcrumbsList} />
      <MetricsCard metrics={metrics} />
      {course ? (
        <ProfessorInfoCard professorName={professorName} course={course} />
      ) : null}
    </div>
  );
}
