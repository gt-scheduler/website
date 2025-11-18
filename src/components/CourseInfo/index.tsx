import React, { useContext, useEffect, useMemo, useState } from 'react';

import Cancellable from '../../utils/cancellable';
import { Button, MetricsCard, ProfessorInfoCard } from '..';
import { ScheduleContext } from '../../contexts';
import {
  CourseGpa,
  CrawlerPrerequisites,
  PrerequisiteSet,
  CourseInfoType,
  MetricData,
} from '../../types';
import { ErrorWithFields, softError } from '../../log';
import TabBar from '../TabBar';
import {
  getSemesterName,
  getTermFromSemesterName,
} from '../../utils/semesters';
import useAggregatedMetrics from '../../hooks/getAggregatedMetrics';

import './stylesheet.scss';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export type CourseInfoProps = {
  courseId: string;
  infoType: CourseInfoType;
  isModal?: boolean;
  onHide?: () => void;
};

function PrerequisiteRenderer({
  prereq,
}: {
  prereq: CrawlerPrerequisites;
}): JSX.Element {
  if (!prereq || prereq.length === 0) return <span>N/A</span>;

  if (!Array.isArray(prereq) || prereq.length === 0) return <span>N/A</span>;

  const [operator, ...clauses] = prereq as PrerequisiteSet;

  return (
    <span>
      {clauses.map((clause, index) => {
        const isLast = index === clauses.length - 1;

        if ('id' in clause) {
          const course = clause;
          return (
            <span key={course.id}>
              {course.id}
              {!isLast && ` ${operator.toLowerCase()} `}
            </span>
          );
        }

        // Nested set
        return (
          <span key={index}>
            <PrerequisiteRenderer prereq={clause as PrerequisiteSet} />
            {!isLast && ` ${operator.toLowerCase()} `}
          </span>
        );
      })}
    </span>
  );
}

export default function CourseInfo({
  courseId,
  infoType,
  isModal = false,
  onHide,
}: CourseInfoProps): React.ReactElement | null {
  const [gpaMap, setGpaMap] = useState<CourseGpa | null>(null);
  const [allProfessors, setAllProfessors] = useState<string[]>([]);
  const [credits, setCredits] = useState<number | undefined>(undefined);

  const [{ term, oscar }] = useContext(ScheduleContext);
  const [selectedTerm, setSelectedTerm] = useState<string>(term);

  const { data: courseMetrics, loading: courseMetricsLoading } =
    useAggregatedMetrics({
      courses: [courseId],
      metricNames: ['overall', 'difficulty', 'workload'],
    });

  const metricsState = useMemo(() => {
    return {
      overall:
        courseMetrics.find((m) => m.metricName === 'overall')?.average ?? null,
      difficulty:
        courseMetrics.find((m) => m.metricName === 'difficulty')?.average ??
        null,
      workload:
        courseMetrics.find((m) => m.metricName === 'workload')?.average ?? null,
      loading: courseMetricsLoading,
    };
  }, [courseMetrics, courseMetricsLoading]);

  useEffect(() => {
    const course = oscar.findCourse(courseId);

    if (course == null) return;

    // Allow the operation to be cancelled early (if the component unmounts)
    const loadOperation = new Cancellable();
    async function loadCourseGpa(): Promise<void> {
      if (course == null) return;

      const promise = course.fetchGpa();
      const result = await loadOperation.perform(promise);
      if (!result.cancelled) {
        setGpaMap(result.value);
      }
    }

    loadCourseGpa().catch((err) => {
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

    return (): void => {
      loadOperation.cancel();
    };
  }, [oscar, courseId]);

  const course = oscar.findCourse(courseId);

  useEffect(() => {
    if (course) {
      const currentTermProfs = course.sections.flatMap((s) => s.instructors);
      const pastTermProfs = course.additionalTermInfo
        ? Object.values(course.additionalTermInfo).flat()
        : [];

      const allProfs = Array.from(
        new Set([...currentTermProfs, ...pastTermProfs])
      );
      setAllProfessors(allProfs);
    }
  }, [course]);

  const instructorsForSelectedTerm = useMemo(() => {
    if (!course || !selectedTerm) return [];

    let instructorsForTerm: string[] = [];

    if (selectedTerm === course.term) {
      // Current term, get from sections
      const sectionsForCurrentTerm = course.sections.filter(
        (s) => s.term && s.term === selectedTerm
      );
      instructorsForTerm = Array.from(
        new Set(sectionsForCurrentTerm.flatMap((s) => s.instructors))
      );
    } else {
      // Past term, get from additionalTermInfo
      instructorsForTerm =
        course.additionalTermInfo?.[getSemesterName(selectedTerm)] ?? [];
    }

    return instructorsForTerm;
  }, [course, selectedTerm]);

  const { data: profMetricsData } = useAggregatedMetrics({
    professors: allProfessors,
    metricNames: ['overall', 'gpa', 'difficulty', 'workload'],
  });

  const profMetricMap = useMemo(() => {
    const map: Record<string, MetricData> = {};

    // Populate the map with metrics for each professor
    allProfessors.forEach((prof) => {
      const items = profMetricsData.filter(
        (m) => m.type === 'professor' && m.professorId === prof
      );

      const obj: Record<string, number> = {};
      items.forEach((m) => {
        obj[m.metricName] = m.average;
      });

      map[prof] = obj;
    });

    return map;
  }, [profMetricsData, allProfessors]);

  useEffect(() => {
    if (course?.sections[0]?.credits !== undefined) {
      setCredits(course.sections[0].credits);
    } else {
      setCredits(undefined);
    }
  }, [course]);

  if (course == null) return null;

  function mockStats(
    denom: number,
    classname: string,
    round = 2,
    include_denom = true
  ): string {
    let hash = 0;
    for (let i = 0; i < classname.length; i++) {
      hash = (hash * 31 + classname.charCodeAt(i)) >>> 0;
    }
    hash %= 10;
    const biased = Math.abs(Math.sin(hash)) ** 0.5; // sqrt → shifts values upward
    console.log(classname, hash, biased);
    const score = 1 + biased * (denom - 1); // scale to [1, denom]
    const num = score.toFixed(round);
    return `${num}${include_denom ? `/${denom}` : ''}`;
  }

  return (
    <div className="CourseInfo">
      <div className="course-info-short">
        <div className="main-course-info">
          {isModal && onHide && (
            <div className="course-header-container-modal">
              <div className="course-header-modal">
                <div className="course-title-container">
                  <div className="course-id">{courseId}</div>
                  <div className="course-title">{course.title}</div>
                </div>
                <div className="course-credits">
                  {credits !== undefined
                    ? `${credits} Credit${credits !== 1 ? 's' : ''}`
                    : 'N/A'}
                </div>
              </div>
              <Button className="cancel-button" onClick={(): void => onHide()}>
                <FontAwesomeIcon icon={faXmark} size="lg" />
              </Button>
            </div>
          )}
          {!isModal && (
            <div className="course-header">
              <div className="course-title-container">
                <div className="course-id">{courseId}</div>
                <div className="course-title">{course.title}</div>
              </div>
              <div className="course-credits">
                {credits !== undefined
                  ? `${credits} Credit${credits !== 1 ? 's' : ''}`
                  : 'N/A'}
              </div>
            </div>
          )}

          <MetricsCard
            metrics={[
              {
                label: 'Overall Rating',
                /* eslint-disable-next-line */
                value: mockStats(5, courseId + '1'),
                // metricsState.overall !== null &&
                // metricsState.overall !== undefined
                //   ? metricsState.overall.toFixed(2)
                //   : 'N/A',
              },
              {
                label: 'Average GPA',
                value:
                  gpaMap === null
                    ? 'Loading...'
                    : gpaMap.averageGpa
                    ? gpaMap.averageGpa.toFixed(2)
                    : 'N/A',
              },
              {
                label: 'Difficulty',
                /* eslint-disable-next-line */
                value: mockStats(5, courseId + '2'),
                // metricsState.difficulty !== null &&
                // metricsState.difficulty !== undefined
                //   ? metricsState.difficulty.toFixed(2)
                //   : 'N/A',
              },
              {
                label: 'Workload',
                /* eslint-disable-next-line */
                value: mockStats(14, courseId + '3', 1, false),
                // metricsState.workload !== null &&
                // metricsState.workload !== undefined
                //   ? metricsState.workload.toFixed(2)
                //   : 'N/A',
                unit: 'hrs/week',
              },
            ]}
          />

          <div className="course-description">
            {course.description || 'No description available.'}
          </div>

          <div className="course-eligibility">
            <div className="eligibility-label">Eligibility</div>
            <ul className="eligibility-list">
              <li>
                <span className="eligibility-label">Prerequisites:</span>{' '}
                <PrerequisiteRenderer
                  prereq={course.prereqs as CrawlerPrerequisites}
                />
              </li>
              <li>
                <span className="eligibility-label">Major Restrictions:</span>{' '}
                {course.restrictions?.[0]
                  ? `${course.restrictions[0].values
                      .map((v) => v.name)
                      .join(', ')}${
                      course.restrictions[0].allowed ? '' : ' (Not allowed)'
                    }`
                  : 'N/A'}
              </li>
            </ul>
          </div>
        </div>
        <div className="terms-container">
          <div className="terms-label">Offered Terms</div>
          <TabBar
            enableSelect={infoType === 'long'}
            items={[
              // Current term first
              { key: term, label: getSemesterName(term) },
              ...Object.keys(course.additionalTermInfo)
                .map((label) => ({
                  label,
                  key: getTermFromSemesterName(label) ?? label,
                }))
                .sort((a, b) => (b.key ?? '').localeCompare(a.key ?? '')), // reverse chronological
            ]}
            selected={{
              key: selectedTerm,
              label: getSemesterName(selectedTerm),
            }}
            onSelect={(nextTerm): void => {
              setSelectedTerm(nextTerm);
            }}
          />
        </div>
      </div>

      {infoType === 'long' && course.additionalTermInfo && (
        <div className="long-info">
          {instructorsForSelectedTerm.map((instructorName) => (
            <ProfessorInfoCard
              professorName={instructorName}
              professorMetrics={profMetricMap[instructorName] as MetricData}
              course={course}
              displaySectionInfo={selectedTerm === term}
            />
          ))}
        </div>
      )}
    </div>
  );
}
