import React from 'react';

import { Breadcrumb } from '../components';
import { BreadcrumbItem } from '../components/Breadcrumb';

export default function ProfessorInfo(): React.ReactElement {
  const breadcrumbItem1: BreadcrumbItem = {
    label: 'Course Details',
    link: 'https://en.wikipedia.org/wiki/Website',
  };
  const breadcrumbItem2: BreadcrumbItem = { label: 'LMC 3705 Section Details' };
  const breadcrumbsList = [breadcrumbItem1, breadcrumbItem2];

  return (
    <div>
      <Breadcrumb items={breadcrumbsList} />
    </div>
  );
}
