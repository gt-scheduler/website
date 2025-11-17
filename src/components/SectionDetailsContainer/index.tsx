import React, { useContext } from 'react';
import { AppNavigationContext } from '../App/navigation';
import Breadcrumb, { BreadcrumbItem } from '../Breadcrumb';

export default function SectionDetailsContainer(): React.ReactElement {
  const { currentSchedulerPage, setCurrentSchedulerPage } =
    useContext(AppNavigationContext);

  if (currentSchedulerPage.type !== 'section-details') {
    return <div>no section details</div>;
  }

  const { course } = currentSchedulerPage;
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Course Details',
      onClick: (): void => {
        try {
          setCurrentSchedulerPage({ type: 'course-details' });
        } catch (e) {
          console.error(e);
        }
      },
    },
    { label: `${course.id} Section Details` },
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />
    </div>
  );
}
