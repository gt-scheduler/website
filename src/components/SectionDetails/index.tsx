import React, { useContext } from 'react';

import CourseInfo from '../CourseInfo';

import './stylesheet.scss';
import Breadcrumb, { BreadcrumbItem } from '../Breadcrumb';
import { AppNavigationContext, SchedulerPageType } from '../App/navigation';

export type SectionDetailsProps = {
  courseId: string;
};

export default function SectionDetails({
  courseId,
}: SectionDetailsProps): React.ReactElement {
  const { setCurrentSchedulerPage } = useContext(AppNavigationContext);

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Course Details',
      onClick: (): void => {
        try {
          setCurrentSchedulerPage({ type: SchedulerPageType.COURSE_DETAILS });
        } catch (e) {
          console.error(e);
        }
      },
    },
    { label: `${courseId} Section Details` },
  ];

  return (
    <div className="section-details-container">
      <Breadcrumb items={breadcrumbItems} />
      <CourseInfo courseId={courseId} enableTermSelect />
    </div>
  );
}
