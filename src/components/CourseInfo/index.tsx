import React, { useContext, useEffect, useMemo, useState } from 'react';

import { ScheduleContext } from '../../contexts';
import { serializePrereqs } from '../../utils/misc';
import { CourseGpa, CrawlerPrerequisites } from '../../types';
import { slugifyProfessor } from '../../data/beans/Course';
import MetricsCard from '../MetricsCard';
import TabBar from '../TabBar';
import { ErrorWithFields, softError } from '../../log';
import { getSemesterName } from '../../utils/semesters';
import ProfessorInfoCard from '../ProfessorInfoCard';

import './stylesheet.scss';

export type CourseInfoProps = {
  courseId: string;
  enableTermSelect?: boolean;
};

// Need to create course info short and course info long

export default function CourseInfo({
  courseId,
  enableTermSelect = false,
}: CourseInfoProps): React.ReactElement {
  const [{ oscar, term }] = useContext(ScheduleContext);
  const course = useMemo(() => oscar.findCourse(courseId), [oscar, courseId]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isProfessorRatingsLoaded, setIsProfessorRatingsLoaded] =
    useState(false);
  const [selectedTermKey, setSelectedTermKey] = useState<string | null>(null);
  const [gpaMap, setGpaMap] = useState<CourseGpa | null>(null);

  useEffect(() => {
    if (course) {
      Promise.all([course.fetchGpa(), course.fetchRatings()])
        .then(([gpaData]) => {
          setGpaMap(gpaData);
          setIsLoaded(true);
        })
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'error fetching course data',
              source: err,
              fields: {
                courseId,
                term: course.term,
              },
            })
          );
        });
    }
  }, [course, courseId]);

  const prerequisite = useMemo(() => {
    return course?.prereqs
      ? serializePrereqs(
          course.prereqs as Exclude<CrawlerPrerequisites, []>
        ).replace(/^\(|\)$/g, '')
      : 'None';
  }, [course?.prereqs]);
  const credits = useMemo(() => course?.sections?.[0]?.credits, [course]);

  /**
   * Get the currterm + 5 terms prior to current term in course crit response
   *
   * Note that course critique as of Spr2025 only has data up to Spr2024
   * This can make it incomplete (ie. From Spring 2025 to Spring 2024)
   */
  const offeredTerms = useMemo(() => {
    const termInfo = course?.termInfo;

    if (!termInfo || !term || !isLoaded) return [];

    return Object.keys(termInfo)
      .filter((termKey) => {
        return termKey.localeCompare(term) <= 0;
      })
      .sort((a, b) => {
        return b.localeCompare(a);
      })
      .slice(0, 6);
  }, [course, isLoaded, term]);

  const tabItems = useMemo(
    () =>
      offeredTerms.map((termItem) => ({
        key: termItem,
        label: getSemesterName(termItem, true),
      })),
    [offeredTerms]
  );

  const selectedTabItem = useMemo(
    () => tabItems.find((t) => t.key === selectedTermKey),
    [tabItems, selectedTermKey]
  );

  useEffect(() => {
    if (enableTermSelect) {
      if (course) {
        Promise.all([course.fetchProfessorRatings(course.term)])
          .then(() => {
            setIsProfessorRatingsLoaded(true);
          })
          .catch((err) => {
            softError(
              new ErrorWithFields({
                message: 'error fetching professor ratings',
                source: err,
                fields: {
                  courseId,
                  term: course.term,
                },
              })
            );
          });
      }
      if (offeredTerms.length > 0 && !selectedTermKey) {
        setSelectedTermKey(
          offeredTerms && offeredTerms[0] ? offeredTerms[0] : null
        );
      }
    }
  }, [enableTermSelect, course, offeredTerms, selectedTermKey]);

  const instructorsForSelectedTerm = useMemo(() => {
    if (!course || !selectedTermKey) return [];

    const rawInstructors = course.termInfo?.[selectedTermKey] ?? [];
    return Array.from(new Set(rawInstructors));
  }, [course, selectedTermKey]);

  const formatValue = (val: number, decimals: number): string =>
    Number.isInteger(val) ? val.toString() : val.toFixed(decimals);

  const metrics = useMemo(() => {
    if (!isLoaded || !course?.ratings) {
      return [
        { label: 'Overall Rating', value: '—' },
        {
          label: 'Course GPA',
          value:
            gpaMap === null
              ? 'Loading...'
              : gpaMap.averageGpa
              ? formatValue(gpaMap.averageGpa, 2)
              : '-',
        },
        { label: 'Level of Difficulty', value: '—' },
        { label: 'Workload', value: '—', unit: 'hrs/week' },
      ];
    }

    return [
      {
        label: 'Overall Rating',
        value: `${formatValue(course.ratings.averageRating, 2)}/5`,
      },
      {
        label: 'Course GPA',
        value:
          gpaMap === null
            ? 'Loading...'
            : gpaMap.averageGpa
            ? formatValue(gpaMap.averageGpa, 2)
            : '-',
      },
      {
        label: 'Level of Difficulty',
        value: `${formatValue(course.ratings.averageDifficulty, 1)}/5`,
      },
      {
        label: 'Workload',
        value: formatValue(course.ratings.averageWorkload, 1),
        unit: 'hrs/week',
      },
    ];
  }, [isLoaded, course?.ratings, gpaMap]);

  // This function generates metrics for a specific professor
  const getProfessorMetrics = (
    professorName: string
  ): { label: string; value: string; unit?: string }[] => {
    const profGpa = gpaMap?.[professorName];
    const slugifiedName = slugifyProfessor(professorName);
    if (
      !isProfessorRatingsLoaded ||
      !course?.professorRatings ||
      !course.professorRatings[slugifiedName]
    ) {
      return [
        { label: 'Overall Rating', value: '—' },
        {
          label: 'Course GPA',
          value: profGpa ? formatValue(profGpa, 2) : '—',
        },
        { label: 'Level of Difficulty', value: '—' },
        { label: 'Workload', value: '—', unit: 'hrs/week' },
      ];
    }

    return [
      {
        label: 'Overall Rating',
        value: `${formatValue(
          course?.professorRatings[slugifiedName]!.averageRating,
          2
        )}/5`,
      },
      {
        label: 'Course GPA',
        value: profGpa ? formatValue(profGpa, 2) : '-',
      },
      {
        label: 'Level of Difficulty',
        value: `${formatValue(
          course?.professorRatings[slugifiedName]!.averageDifficulty,
          1
        )}/5`,
      },
      {
        label: 'Workload',
        value: formatValue(
          course?.professorRatings[slugifiedName]!.averageWorkload,
          1
        ),
        unit: 'hrs/week',
      },
    ];
  };

  if (!course) {
    return <div />;
  }

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
      {offeredTerms.length > 0 && (
        <div className="course-terms">
          <div
            className="course-info-subtitle"
            style={{ visibility: enableTermSelect ? 'hidden' : 'visible' }}
          >
            Offered Terms
          </div>
          <div className="term-info">
            <TabBar
              className={`course-terms-tab-bar${
                enableTermSelect ? ' enable-select' : ''
              }`}
              items={tabItems}
              selected={selectedTabItem}
              onSelect={setSelectedTermKey}
              enableSelect={enableTermSelect}
            />
            {enableTermSelect && (
              <div className="professor-cards">
                {instructorsForSelectedTerm.map((instructorName) => (
                  <ProfessorInfoCard
                    key={instructorName}
                    professorName={instructorName}
                    professorMetrics={getProfessorMetrics(instructorName)}
                    course={course}
                    displaySectionInfo={selectedTermKey === term}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
