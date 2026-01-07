import React, { useContext } from 'react';

import CourseInfo from '../CourseInfo';
import Breadcrumb, { BreadcrumbItem } from '../Breadcrumb';
import { AppNavigationContext, SchedulerPageType } from '../App/navigation';
import { ErrorWithFields, softError } from '../../log';

import './stylesheet.scss';

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
          softError(
            new ErrorWithFields({
              message: 'error fetching section details',
              source: e,
              fields: {
                courseId,
              },
            })
          );
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
