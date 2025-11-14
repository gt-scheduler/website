import React, { useContext, useEffect, useMemo, useState } from 'react';

import Cancellable from '../../utils/cancellable';
import { MetricsCard, ProfessorInfoCard } from '..';
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

export type CourseInfoProps = {
  courseId: string;
  infoType: CourseInfoType;
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

  return (
    <div className="CourseInfo">
      <div className="course-info-short">
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

        <MetricsCard
          metrics={[
            {
              label: 'Overall Rating',
              value:
                metricsState.overall !== null &&
                metricsState.overall !== undefined
                  ? metricsState.overall.toFixed(2)
                  : 'N/A',
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
              value:
                metricsState.difficulty !== null &&
                metricsState.difficulty !== undefined
                  ? metricsState.difficulty.toFixed(2)
                  : 'N/A',
            },
            {
              label: 'Workload',
              value:
                metricsState.workload !== null &&
                metricsState.workload !== undefined
                  ? metricsState.workload.toFixed(2)
                  : 'N/A',
              unit: 'hrs/week',
            },
          ]}
        />

        <div>{course.description || 'No description available.'}</div>

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
              <span className="eligibility-label">Corequisites:</span> TODO
            </li>
            <li>
              <span className="eligibility-label">Major Lock:</span> TODO
            </li>
          </ul>
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
