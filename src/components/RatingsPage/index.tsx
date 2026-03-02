import React, { useContext, useEffect, useMemo, useState } from 'react';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { shouldDisplayRatings, slugify } from '../../utils/misc';
import { ScheduleContext } from '../../contexts/schedule';
import Oscar from '../../data/beans/Oscar';
import Section from '../../data/beans/Section';
import useDownloadOscarData from '../../data/hooks/useDownloadOscarData';
import CourseRatingCard from '../CourseRatingCard';
import RateCard, { RateCardData } from '../RateCard';
import useSubmitRatings from '../../data/hooks/useSubmitRatings';
import { SubmitRatingsRequestData } from '../../data/types';
import Button from '../Button';
import { AppNavigationContext } from '../App/navigation';
import {
  RATINGS_CACHE_LOCAL_STORAGE_KEY,
  PROFESSOR_RATINGS_CACHE_LOCAL_STORAGE_KEY,
} from '../../data/beans/Course';
import { LoadingState } from '../../types';
import LoadingDisplay from '../LoadingDisplay';
import { SkeletonContent } from '../App/content';
import { getSemesterName } from '../../utils/semesters';
import { ErrorWithFields, softError } from '../../log';
import useScreenWidth from '../../hooks/useScreenWidth';
import { DESKTOP_BREAKPOINT } from '../../constants';
import { AccountContext } from '../../contexts';

import './stylesheet.scss';

type OverrideOscarLoaderProps = {
  overrideTerm: string;
  children: (state: LoadingState<Oscar>) => React.ReactElement;
};

function OverrideOscarLoader({
  overrideTerm,
  children,
}: OverrideOscarLoaderProps): React.ReactElement | null {
  const { setTab } = useContext(AppNavigationContext);
  const [attempt, setAttempt] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);
  const state = useDownloadOscarData(overrideTerm);

  useEffect(() => {
    if (state.type === 'error') {
      if (attempt === 0) {
        // First failure: retry automatically by incrementing attempt
        setAttempt(1);
      } else if (!hasFailed) {
        // Second failure: report soft error and navigate home
        softError(
          new ErrorWithFields({
            message: 'error fetching oscar object',
            source: state.error,
            fields: {
              overrideTerm,
            },
          })
        );
        setHasFailed(true);
        setTab('Scheduler');
      }
    }
  }, [state, attempt, hasFailed, setTab, overrideTerm]);

  if (state.type === 'error' && attempt === 1 && !hasFailed) {
    return null;
  }

  return children(state);
}

const RATINGS_STORAGE_KEY = (term: string): string =>
  `gt_scheduler_ratings_state_${term}`;

interface CollectedRating extends RateCardData {
  courseId: string;
  professorId: string;
  term: number;
}

type RatingsMap = Record<string, CollectedRating>;

interface PersistedRatingsState {
  selectedCrns: string[];
  currentIndex: number;
  ratingsMap: RatingsMap;
  term: string;
}

type RatingsPageInnerProps = {
  overrideTerm?: string;
  overrideOscarState?: LoadingState<Oscar>;
};

function RatingsPageInner({
  overrideTerm,
  overrideOscarState,
}: RatingsPageInnerProps): React.ReactElement {
  const { setTab } = useContext(AppNavigationContext);
  const [scheduleState] = useContext(ScheduleContext);
  const {
    oscar: contextOscar,
    pinnedCrns: contextPinnedCrns,
    term: contextTerm,
  } = scheduleState;

  const isOverride = overrideTerm != null;
  const ratingTerm = isOverride ? overrideTerm : contextTerm;

  const oscar =
    isOverride && overrideOscarState?.type === 'loaded'
      ? overrideOscarState.result
      : contextOscar;

  const allSections = useMemo(
    () =>
      Object.values(oscar.crnMap).filter(
        (s): s is Section => s instanceof Section
      ),
    [oscar.crnMap]
  );

  const saved = localStorage.getItem(RATINGS_STORAGE_KEY(ratingTerm));
  let initialSelectedCrns: string[] = [];
  let initialRatingsMap: RatingsMap = {};
  let initialCurrentIndex = 0;

  if (saved) {
    try {
      const parsed = JSON.parse(saved) as PersistedRatingsState;
      if (parsed.term === ratingTerm) {
        initialSelectedCrns = parsed.selectedCrns;
        initialRatingsMap = parsed.ratingsMap ?? {};
        initialCurrentIndex = parsed.currentIndex ?? 0;
      }
    } catch {
      localStorage.removeItem(RATINGS_STORAGE_KEY(ratingTerm));
    }
  }

  const [selectedSections, setSelectedSections] = useState<Section[]>(() =>
    initialSelectedCrns.length > 0
      ? initialSelectedCrns
          .map((crn) => oscar.crnMap[crn])
          .filter((s): s is Section => s instanceof Section)
      : isOverride
      ? []
      : allSections.filter((s) => contextPinnedCrns.includes(s.crn))
  );

  const [unselectedSections, setUnselectedSections] = useState<Section[]>(() =>
    allSections.filter(
      (s) => !selectedSections.some((sel) => sel.crn === s.crn)
    )
  );

  const [ratingsMap, setRatingsMap] = useState<RatingsMap>(initialRatingsMap);
  const [currentIndex, setCurrentIndex] = useState(initialCurrentIndex);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitData, setSubmitData] = useState<
    Omit<SubmitRatingsRequestData, 'IDToken'> | undefined
  >(undefined);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  useEffect(() => {
    const stateToSave: PersistedRatingsState = {
      selectedCrns: selectedSections.map((s) => s.crn),
      currentIndex,
      ratingsMap,
      term: ratingTerm,
    };
    localStorage.setItem(
      RATINGS_STORAGE_KEY(ratingTerm),
      JSON.stringify(stateToSave)
    );
  }, [selectedSections, currentIndex, ratingsMap, ratingTerm]);

  useSubmitRatings(
    submitData != null
      ? { requestData: submitData }
      : { requestData: { ratings: [] } }
  );

  const handleAddCourse = (section: Section): void => {
    setSelectedSections((prev) => [...prev, section]);
    setUnselectedSections((prev) => prev.filter((s) => s.crn !== section.crn));
    setShowEmptyWarning(false);
  };

  const handleDeleteCourse = (crn: string): void => {
    setSelectedSections((prev) => prev.filter((s) => s.crn !== crn));
    setUnselectedSections((prev) => [
      ...prev,
      ...allSections.filter((s) => s.crn === crn),
    ]);
  };

  const validateCurrentRatings = (): boolean => {
    if (currentIndex <= 0 || currentIndex > selectedSections.length)
      return true;
    const activeSection = selectedSections[currentIndex - 1];
    if (!activeSection) return true;

    const r = ratingsMap[activeSection.crn];
    const isComplete =
      r?.rating !== undefined &&
      r?.difficulty !== undefined &&
      r?.workload !== undefined;

    if (!isComplete) {
      setErrorMessage('Please fill out all fields before proceeding.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNext = (): void => {
    if (!validateCurrentRatings()) return;
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = (): void => {
    setErrorMessage(null);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleBack = (): void => {
    setErrorMessage(null);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleStart = (): void => {
    if (selectedSections.length === 0) {
      setShowEmptyWarning(true);
      return;
    }
    setErrorMessage(null);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleRateChange = (data: RateCardData): void => {
    if (currentIndex <= 0) return;
    const section = selectedSections[currentIndex - 1];
    if (!section) return;
    if (errorMessage) setErrorMessage(null);

    setRatingsMap((prev) => ({
      ...prev,
      [section.crn]: {
        courseId: section.course.id,
        professorId: slugify(section.instructors[0] ?? 'unknown'),
        term: Number(ratingTerm),
        ...(prev[section.crn] ?? {}),
        ...data,
      },
    }));
  };

  const handleSubmit = (skip: boolean): void => {
    if (!skip && !validateCurrentRatings()) return;

    const completeRatings = Object.values(ratingsMap).filter(
      (r): r is Required<CollectedRating> =>
        r.rating != null && r.difficulty != null && r.workload != null
    );

    if (completeRatings.length > 0) {
      setSubmitData({ ratings: completeRatings });
    }
    setCurrentIndex((prev) => prev + 1);

    localStorage.removeItem(RATINGS_STORAGE_KEY(ratingTerm));
    localStorage.removeItem(`${RATINGS_CACHE_LOCAL_STORAGE_KEY}`);
    localStorage.removeItem(`${PROFESSOR_RATINGS_CACHE_LOCAL_STORAGE_KEY}`);
    localStorage.setItem(`ratings_submitted_${ratingTerm}`, 'true');
  };

  if (isOverride && overrideOscarState?.type === 'loading') {
    return (
      <div className="ratings-container">
        <SkeletonContent>
          <LoadingDisplay
            state={overrideOscarState}
            name={`Oscar course data for ${getSemesterName(ratingTerm)}`}
          />
        </SkeletonContent>
      </div>
    );
  }

  if (isOverride && overrideOscarState?.type === 'error') {
    return (
      <div className="scroller">
        <div className="ratings-container">
          <div className="error-message">{overrideOscarState.overview}</div>
          <button
            type="button"
            className="start-button"
            onClick={(): void => setTab('Scheduler')}
          >
            Back to Scheduler
          </button>
        </div>
      </div>
    );
  }

  const progress =
    selectedSections.length > 0
      ? Math.min((currentIndex / (selectedSections.length + 1)) * 100, 100)
      : currentIndex > 0
      ? 100 // assume fully completed for submitted ratings
      : 0;

  const activeSection =
    currentIndex > 0 && currentIndex <= selectedSections.length
      ? selectedSections[currentIndex - 1]
      : undefined;

  const activeCourseLabel = activeSection
    ? `${activeSection.course.subject} ${activeSection.course.number} ${activeSection.course.title}`
    : '';
  const activeInstructorLabel = activeSection
    ? activeSection.instructors.length
      ? activeSection.instructors.join(', ')
      : 'TBA'
    : '';

  const isDone = currentIndex > selectedSections.length;

  return (
    <div className="scroller">
      <div className="ratings-container">
        <div className="progress-header">
          <span className="header-label">Rate my courses</span>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }} />
          </div>
          <Button
            className="close-button"
            onClick={(): void => setTab('Scheduler')}
          >
            <FontAwesomeIcon fixedWidth icon={faXmark} size="lg" />
          </Button>
        </div>

        <div className="sub-container">
          {currentIndex === 0 && !isDone ? (
            <CourseRatingCard
              term={ratingTerm}
              selectedSections={selectedSections}
              unselectedSections={unselectedSections}
              onAddCourse={handleAddCourse}
              onDeleteCourse={handleDeleteCourse}
              showEmptyWarning={showEmptyWarning}
              setShowEmptyWarning={setShowEmptyWarning}
            />
          ) : activeSection && !isDone ? (
            <RateCard
              key={activeSection.crn}
              course={activeCourseLabel}
              instructor={activeInstructorLabel}
              onChange={handleRateChange}
              initialData={ratingsMap[activeSection.crn]}
            />
          ) : (
            <div className="done-container">
              <img
                src="/buzz_happy.png"
                alt="All done"
                className="done-image"
              />
              <div className="done-message">
                <div className="done">You&apos;re all done!</div>
                <div className="thank-you">
                  Thank you for your time and feedback
                </div>
              </div>
            </div>
          )}

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          {!isDone &&
            (currentIndex === 0 ? (
              <button
                type="button"
                className="start-button"
                onClick={handleStart}
              >
                Start
              </button>
            ) : currentIndex < selectedSections.length ? (
              <div className="button-group">
                <div className="nav-buttons">
                  <button
                    type="button"
                    className="back-button"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="next-button"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                </div>
                <button
                  type="button"
                  className="skip-button"
                  onClick={handleSkip}
                >
                  Skip this course
                </button>
              </div>
            ) : (
              <div className="button-group">
                <div className="nav-buttons">
                  <button
                    type="button"
                    className="back-button"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="next-button"
                    onClick={(): void => handleSubmit(false)}
                  >
                    Submit
                  </button>
                </div>
                <button
                  type="button"
                  className="skip-button"
                  onClick={(): void => handleSubmit(true)}
                >
                  Skip this course and submit
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

type RatingsPageProps = {
  overrideTerm?: string;
};

export default function RatingsPage({
  overrideTerm,
}: RatingsPageProps): React.ReactElement {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);
  const { type } = useContext(AccountContext);
  const { setTab } = useContext(AppNavigationContext);

  // Non-logged in and mobile users should not be able to rate
  if (!shouldDisplayRatings(!mobile, type)) {
    setTab('Scheduler');
  }

  if (overrideTerm != null) {
    return (
      <OverrideOscarLoader overrideTerm={overrideTerm}>
        {(state): React.ReactElement => (
          <RatingsPageInner
            overrideTerm={overrideTerm}
            overrideOscarState={state}
          />
        )}
      </OverrideOscarLoader>
    );
  }

  return <RatingsPageInner />;
}
