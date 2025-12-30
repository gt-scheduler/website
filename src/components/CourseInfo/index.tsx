import React, { useContext, useMemo } from 'react';

import { ScheduleContext } from '../../contexts';
import { serializePrereqs } from '../../utils/misc';
import { CrawlerPrerequisites } from '../../types';
import MetricsCard from '../MetricsCard';

import './stylesheet.scss';

export type CourseInfoProps = {
  courseId: string;
};

export default function CourseInfo({
  courseId,
}: CourseInfoProps): React.ReactElement {
  const [{ oscar }] = useContext(ScheduleContext);
  const course = useMemo(() => oscar.findCourse(courseId), [oscar, courseId]);
  const prerequisite = useMemo(() => {
    return course?.prereqs
      ? serializePrereqs(course.prereqs as Exclude<CrawlerPrerequisites, []>)
      : 'None';
  }, [course?.prereqs]);
  const credits = useMemo(() => course?.sections?.[0]?.credits, [course]);

  if (!course) {
    return <div />;
  }

  const metrics = [
    {
      label: 'Overall Rating',
      value: '3.91/5',
    },
    {
      label: 'Course GPA',
      value: '3.91',
    },
    {
      label: 'Level of Difficulty',
      value: '3.4/5',
    },
    {
      label: 'Workload',
      value: '14.5',
      unit: 'hrs/week',
    },
  ];

  return (
    <div className="course-info-container">
      <div className="course-info-content">
        <div className="course-header">
          <div className="course-title-container">
            <div className="course-id">{courseId}</div>
            <div className="course-title">{course.title}</div>
          </div>

          {credits !== undefined && (
            <div className="course-credits">{`${credits} Credit${
              credits !== 1 ? 's' : ''
            }`}</div>
          )}
        </div>
        <div className="course-metrics">
          <MetricsCard metrics={metrics} />
        </div>
        <div>{course?.description || 'No description available'}</div>
        <div className="course-eligibility">
          <div className="course-info-subtitle">Eligibility</div>
          <ul className="course-eligibility-content">
            <li>
              <div className="course-eligibility-list-item">
                <div className="course-eligibility-content-title">
                  Prerequisites
                </div>
                {prerequisite || 'None'}
              </div>
            </li>
            <li>
              <div className="course-eligibility-list-item">
                <div className="course-eligibility-content-title">
                  Corequisites
                </div>
                {course.coreqs && course.coreqs.length > 0
                  ? course.coreqs.map((coreq) => coreq.id).join(', ')
                  : 'None'}
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div className="course-terms">
        <div className="course-info-subtitle">Offered Terms</div>
        <div>course terms placeholder</div>
      </div>
    </div>
  );
}
