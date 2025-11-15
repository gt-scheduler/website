import React, { useContext, useMemo, useState } from 'react';

import { ScheduleContext } from '../../contexts/schedule';
import Section from '../../data/beans/Section';
import CourseRatingCard from '../CourseRatingCard';
import RateCard from '../RateCard';
import useSubmitMetrics from '../../data/hooks/useSubmitMetrics';
import { MetricName, SubmitMetricsRequestData } from '../../data/types';
import './stylesheet.scss';

export default function RatingsPage(): React.ReactElement {
  const [{ pinnedCrns, oscar }] = useContext(ScheduleContext);

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

  const [collectedMetrics, setCollectedMetrics] = useState<
    (Partial<SubmitMetricsRequestData> | undefined)[]
  >([]);

  const [submitData, setSubmitData] = useState<
    Partial<SubmitMetricsRequestData>
  >({
    metricName: MetricName.DIFFICULTY,
    targets: [],
    values: [],
  });

  useSubmitMetrics({
    requestData: submitData as SubmitMetricsRequestData,
  });

  const handleAddCourse = (section: Section): void => {
    setSelectedSections((prev) => [...prev, section]);
    setUnselectedSections((prev) => prev.filter((s) => s.crn !== section.crn));
  };

  const handleDeleteCourse = (crn: string): void => {
    setSelectedSections((prev) => prev.filter((s) => s.crn !== crn));
    setUnselectedSections((prev) => [
      ...prev,
      ...allSections.filter((s) => s.crn === crn),
    ]);
  };

  const handleNext = (): void => setCurrentIndex((prev) => prev + 1);

  const handleRateChange = (data: Partial<SubmitMetricsRequestData>): void => {
    if (currentIndex <= 0) return;

    const idx = currentIndex - 1;

    setCollectedMetrics((prev) => {
      const next = [...prev];
      next[idx] = data;
      return next;
    });
  };

  const handleSubmit = (): void => {
    const nonEmpty = collectedMetrics.filter(
      (m): m is Partial<SubmitMetricsRequestData> =>
        m != null &&
        ((m.targets?.length ?? 0) > 0 || (m.values?.length ?? 0) > 0)
    );

    if (nonEmpty.length === 0) return;

    const merged: Partial<SubmitMetricsRequestData> = {
      metricName: MetricName.DIFFICULTY,
      targets: nonEmpty.flatMap((d) => d.targets ?? []),
      values: nonEmpty.flatMap((d) => d.values ?? []),
    };

    setSubmitData(merged);
    setCurrentIndex((prev) => prev + 1);
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

  const activeSectionLabel = activeSection ? activeSection.id : '';
  const activeInstructorLabel = activeSection
    ? activeSection.instructors.length
      ? activeSection.instructors.join(', ')
      : 'TBA'
    : '';

  const isDone = currentIndex > selectedSections.length;

  return (
    <div className="ratings-container">
      <div className="sub-container">
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>

        {currentIndex === 0 && !isDone ? (
          <CourseRatingCard
            selectedSections={selectedSections}
            unselectedSections={unselectedSections}
            onAddCourse={handleAddCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        ) : activeSection && !isDone ? (
          <RateCard
            key={activeSection.crn}
            course={activeCourseLabel}
            section={activeSectionLabel}
            instructor={activeInstructorLabel}
            onChange={handleRateChange}
          />
        ) : (
          <div className="done-container">
            <img src="/buzz_happy.png" alt="All done" className="done-image" />
            <div className="done-message">
              <div className="done">You&apos;re all done!</div>
              <div className="thank-you">
                Thank you for your time and feedback
              </div>
            </div>
          </div>
        )}

        {!isDone &&
          (currentIndex === 0 ? (
            <button type="button" className="start-button" onClick={handleNext}>
              Start
            </button>
          ) : currentIndex < selectedSections.length ? (
            <button type="button" className="next-button" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button
              type="button"
              className="next-button"
              onClick={handleSubmit}
            >
              Submit
            </button>
          ))}
      </div>
    </div>
  );
}
