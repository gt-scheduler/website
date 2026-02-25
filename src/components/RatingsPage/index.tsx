import React, { useContext, useEffect, useMemo, useState } from 'react';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { slugify } from '../../utils/misc';
import { ScheduleContext } from '../../contexts/schedule';
import Section from '../../data/beans/Section';
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

import './stylesheet.scss';

const RATINGS_STORAGE_KEY = 'gt_scheduler_ratings_state';

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
}

export default function RatingsPage(): React.ReactElement {
  const { setTab } = useContext(AppNavigationContext);
  const [{ pinnedCrns, oscar, term }] = useContext(ScheduleContext);

  const allSections = useMemo(
    () =>
      Object.values(oscar.crnMap).filter(
        (s): s is Section => s instanceof Section
      ),
    [oscar.crnMap]
  );

  const initialSelected = useMemo(
    () => allSections.filter((s) => pinnedCrns.includes(s.crn)),
    [allSections, pinnedCrns]
  );

  const initialUnselected = useMemo(
    () => allSections.filter((s) => !pinnedCrns.includes(s.crn)),
    [allSections, pinnedCrns]
  );

  const [selectedSections, setSelectedSections] =
    useState<Section[]>(initialSelected);
  const [unselectedSections, setUnselectedSections] =
    useState<Section[]>(initialUnselected);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [ratingsMap, setRatingsMap] = useState<RatingsMap>({});

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [submitData, setSubmitData] = useState<
    Omit<SubmitRatingsRequestData, 'IDToken'> | undefined
  >(undefined);

  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(RATINGS_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as PersistedRatingsState;
      const {
        selectedCrns,
        currentIndex: savedIndex,
        ratingsMap: savedMap,
      } = parsed;
      const reconstructed = selectedCrns
        .map((crn) => oscar.crnMap[crn])
        .filter((s): s is Section => s instanceof Section);
      if (reconstructed.length > 0) {
        setSelectedSections(reconstructed);
        setUnselectedSections(
          allSections.filter((s) => !selectedCrns.includes(s.crn))
        );
        setCurrentIndex(savedIndex);
        setRatingsMap(savedMap);
      }
    } catch {
      localStorage.removeItem(RATINGS_STORAGE_KEY);
    }
  }, [oscar.crnMap, allSections]);

  useEffect(() => {
    const stateToSave: PersistedRatingsState = {
      selectedCrns: selectedSections.map((s) => s.crn),
      currentIndex,
      ratingsMap,
    };
    localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [selectedSections, currentIndex, ratingsMap]);

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
    if (currentIndex <= 0 || currentIndex > selectedSections.length) {
      return true;
    }

    const activeSection = selectedSections[currentIndex - 1];
    if (!activeSection) return true;

    const currentRating = ratingsMap[activeSection.crn];

    const isComplete =
      currentRating &&
      currentRating.rating !== undefined &&
      currentRating.difficulty !== undefined &&
      currentRating.workload !== undefined;

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

    const rawName = section.instructors[0] ?? 'unknown';

    setRatingsMap((prev) => ({
      ...prev,
      [section.crn]: {
        courseId: section.course.id,
        professorId: slugify(rawName),
        term: Number(term),
        ...(prev[section.crn] || {}),
        ...data,
      },
    }));
  };

  const handleSubmit = (skip: boolean): void => {
    if (!skip && !validateCurrentRatings()) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    const allRatings = Object.values(ratingsMap);
    const completeRatings = allRatings.filter(
      (r): r is Required<CollectedRating> =>
        r != null &&
        r.rating != null &&
        r.difficulty != null &&
        r.workload != null
    );

    if (completeRatings.length === 0) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
    setSubmitData({ ratings: completeRatings });
    setCurrentIndex((prev) => prev + 1);

    localStorage.removeItem(RATINGS_STORAGE_KEY);
    localStorage.removeItem(RATINGS_CACHE_LOCAL_STORAGE_KEY);
    localStorage.removeItem(PROFESSOR_RATINGS_CACHE_LOCAL_STORAGE_KEY);

    localStorage.setItem(`ratings_submitted_${term}`, 'true');
  };

  const progress =
    selectedSections.length > 0
      ? Math.min((currentIndex / (selectedSections.length + 1)) * 100, 100)
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
