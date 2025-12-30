import React, { useContext, useEffect, useMemo, useState } from 'react';

import { ScheduleContext } from '../../contexts';
import { serializePrereqs } from '../../utils/misc';
import { CrawlerPrerequisites } from '../../types';
import MetricsCard from '../MetricsCard';
import { getTermFromSemesterName } from '../../utils/semesters';

import './stylesheet.scss';
import TabBar from '../TabBar';
import { ErrorWithFields, softError } from '../../log';

export type CourseInfoProps = {
  courseId: string;
};

export default function CourseInfo({
  courseId,
}: CourseInfoProps): React.ReactElement {
  const [{ oscar }] = useContext(ScheduleContext);
  const course = useMemo(() => oscar.findCourse(courseId), [oscar, courseId]);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (course) {
      course
        .fetchGpa()
        .then(() => {
          setIsLoaded(true);
        })
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'error fetching course GPA',
              source: err,
              fields: {
                courseId,
                term: course.term,
              },
            })
          );
        });
    }
  }, [course]);

  const prerequisite = useMemo(() => {
    return course?.prereqs
      ? serializePrereqs(
          course.prereqs as Exclude<CrawlerPrerequisites, []>
        ).replace(/^\(|\)$/g, '')
      : 'None';
  }, [course?.prereqs]);
  const credits = useMemo(() => course?.sections?.[0]?.credits, [course]);

  /**
   * Get the currterm + 5 terms prior to the current term in course crit response
   *
   * Note that course critique as of Spr2025 only has data up to Spr2024
   * This can make it incomplete (ie. From Spring 2025 to Spring 2024)
   */
  const offered_terms = useMemo(() => {
    const termInfo = course?.termInfo;
    const currentTerm = course?.term;

    if (!termInfo || !currentTerm || !isLoaded) return [];

    return Object.keys(termInfo)
      .filter((termKey) => {
        const termValue = getTermFromSemesterName(termKey) ?? '';
        return termValue.localeCompare(currentTerm) <= 0;
      })
      .sort((a, b) => {
        return (getTermFromSemesterName(b) ?? '').localeCompare(
          getTermFromSemesterName(a) ?? ''
        );
      })
      .slice(0, 6);
  }, [course, isLoaded]);

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
      {offered_terms.length > 0 && (
        <div className="course-terms">
          <div className="course-info-subtitle">Offered Terms</div>
          <div>
            <TabBar
              className="course-terms-tab-bar"
              items={offered_terms.map((term) => ({
                key: term,
                label: term,
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
