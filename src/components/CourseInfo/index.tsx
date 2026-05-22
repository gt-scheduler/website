import React, { useContext, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import { ScheduleContext } from '../../contexts';
import { serializePrereqs, slugify } from '../../utils/misc';
import { CourseGpa, CrawlerPrerequisites } from '../../types';
import MetricsCard from '../MetricsCard';
import TabBar from '../TabBar';
import { ErrorWithFields, softError } from '../../log';
import { getSemesterName } from '../../utils/semesters';
import ProfessorInfoCard from '../ProfessorInfoCard';
import Button from '../Button';
import { MajorRestrictionsView } from '../MajorRestrictionsView';

import './stylesheet.scss';

export type CourseInfoProps = {
  courseId: string;
  enableTermSelect?: boolean;
  isModal?: boolean;
  onHide?: () => void;
};

type CourseHeaderProps = {
  courseId: string;
  title: string;
  credits?: number;
  isModal?: boolean;
  onHide?: () => void;
};

function CourseHeader({
  courseId,
  title,
  credits,
  isModal = false,
  onHide,
}: CourseHeaderProps): React.ReactElement {
  const creditText =
    credits !== undefined
      ? `${credits} Credit${credits !== 1 ? 's' : ''}`
      : 'N/A';

  if (isModal) {
    return (
      <div className="course-header-container-modal">
        <div className="course-header-modal">
          <div className="course-title-container">
            <div className="course-id">{courseId}</div>
            <div className="course-title">{title}</div>
          </div>
          <div className="course-credits">{creditText}</div>
        </div>
        {onHide && (
          <Button className="cancel-button" onClick={onHide}>
            <FontAwesomeIcon icon={faXmark} size="lg" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="course-header">
      <div className="course-title-container">
        <div className="course-id">{courseId}</div>
        <div className="course-title">{title}</div>
      </div>
      {credits !== undefined && (
        <div className="course-credits">{creditText}</div>
      )}
    </div>
  );
}

export default function CourseInfo({
  courseId,
  enableTermSelect = false,
  isModal = false,
  onHide,
}: CourseInfoProps): React.ReactElement {
  const [{ oscar, term }] = useContext(ScheduleContext);
  const course = useMemo(() => oscar.findCourse(courseId), [oscar, courseId]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isRatingsLoaded, setIsRatingsLoaded] = useState(false);
  const [isProfessorRatingsLoaded, setIsProfessorRatingsLoaded] =
    useState(false);
  const [selectedTermKey, setSelectedTermKey] = useState<string | null>(null);
  const [gpaMap, setGpaMap] = useState<CourseGpa | null>(null);
  const [restrictionsViewMajors, setRestrictionsViewMajors] = React.useState<
    string[] | null
  >(null);

  useEffect(() => {
    if (course) {
      course
        .fetchGpa()
        .then((gpaData) => {
          setGpaMap(gpaData);
          setIsLoaded(true);
        })
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'error fetching course gpa',
              source: err,
              fields: {
                courseId,
                term: course.term,
              },
            })
          );
        });
      course
        .fetchRatings()
        .then(() => {
          setIsRatingsLoaded(true);
        })
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'error fetching course ratings',
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
      if (offeredTerms.length > 0 && !selectedTermKey) {
        setSelectedTermKey(
          offeredTerms && offeredTerms[0] ? offeredTerms[0] : null
        );
      }
    }
  }, [enableTermSelect, course, offeredTerms, selectedTermKey]);

  useEffect(() => {
    if (selectedTermKey && course) {
      course
        .fetchProfessorRatings(selectedTermKey)
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
  }, [selectedTermKey, course, courseId]);

  const metrics = useMemo(() => {
    const courseRatings = course?.ratings;
    const courseGpa = gpaMap?.averageGpa;

    return [
      {
        label: 'Overall Rating',
        value: !isRatingsLoaded
          ? 'Loading...'
          : courseRatings
          ? `${courseRatings.averageRating.toFixed(2)}/5`
          : null,
      },
      {
        label: 'Course GPA',
        value: gpaMap === null ? 'Loading...' : courseGpa?.toFixed(2) ?? null,
      },
      {
        label: 'Level of Difficulty',
        value: !isRatingsLoaded
          ? 'Loading...'
          : courseRatings
          ? `${courseRatings.averageDifficulty.toFixed(1)}/5`
          : null,
      },
      {
        label: 'Workload',
        value: !isRatingsLoaded
          ? 'Loading...'
          : courseRatings
          ? courseRatings.averageWorkload.toFixed(1)
          : null,
        unit: 'hrs/week',
      },
    ];
  }, [isRatingsLoaded, course?.ratings, gpaMap]);

  const instructorsForSelectedTerm = useMemo(() => {
    if (!course || !selectedTermKey) return [];

    const rawInstructors = course.termInfo?.[selectedTermKey] ?? [];
    return Array.from(new Set(rawInstructors));
  }, [course, selectedTermKey]);

  if (!course) {
    return <div />;
  }

  if (restrictionsViewMajors !== null) {
    return (
      <MajorRestrictionsView
        majors={restrictionsViewMajors}
        onBack={(): void => setRestrictionsViewMajors(null)}
        onHide={onHide}
        courseName={`${course.subject} ${course.number}`}
      />
    );
  }

  return (
    <div className="course-info-container">
      <div className="course-info-content">
        <CourseHeader
          courseId={courseId}
          title={course.title}
          credits={credits}
          isModal={isModal}
          onHide={onHide}
        />
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
                    professorGpa={gpaMap?.[instructorName] ?? null}
                    professorRatings={
                      course.professorRatings?.[slugify(instructorName)] ?? null
                    }
                    isRatingsLoaded={isProfessorRatingsLoaded}
                    course={course}
                    displaySectionInfo={selectedTermKey === term}
                    onViewRestrictions={
                      isModal ? setRestrictionsViewMajors : undefined
                    }
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
