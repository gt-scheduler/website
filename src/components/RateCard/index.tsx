import React, { useState } from 'react';

import { classes } from '../../utils/misc';
import RateEntry, { StarsValue, TimeValue } from '../RateEntry';

import './stylesheet.scss';

export interface RateCardData {
  rating?: number;
  difficulty?: number;
  workload?: number;
}

type RateCardProps = {
  course: string;
  section: string;
  instructor: string;
  onChange: (data: RateCardData) => void;
  initialData?: RateCardData;
};

export default function RateCard({
  course,
  section,
  instructor,
  onChange,
  initialData,
}: RateCardProps): React.ReactElement {
  const [overallRating, setOverallRating] = useState<StarsValue>(
    (initialData?.rating as StarsValue) ?? null
  );
  const [levelOfDifficulty, setLevelOfDifficulty] = useState<StarsValue>(
    (initialData?.difficulty as StarsValue) ?? null
  );
  const [workload, setWorkload] = useState<TimeValue>(() => {
    const totalMinutes = initialData?.workload;
    if (totalMinutes == null) return { hours: null, minutes: null };
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
    };
  });

  function buildData(
    overall: StarsValue,
    difficulty: StarsValue,
    workloadValue: TimeValue
  ): RateCardData {
    const totalMinutes =
      workloadValue.hours != null || workloadValue.minutes != null
        ? (workloadValue.hours ?? 0) * 60 + (workloadValue.minutes ?? 0)
        : undefined;

    return {
      ...(overall != null && { rating: overall }),
      ...(difficulty != null && { difficulty }),
      ...(totalMinutes != null && { workload: totalMinutes }),
    };
  }

  const handleOverallChange = (value: StarsValue): void => {
    setOverallRating(value);
    onChange(buildData(value, levelOfDifficulty, workload));
  };

  const handleDifficultyChange = (value: StarsValue): void => {
    setLevelOfDifficulty(value);
    onChange(buildData(overallRating, value, workload));
  };

  const handleWorkloadChange = (value: TimeValue): void => {
    setWorkload(value);
    onChange(buildData(overallRating, levelOfDifficulty, value));
  };

  return (
    <div className={classes('ratecard')}>
      <div className="card-header">
        <div className="course-header">{course}</div>
        <div className="instructor-header">Instructor: {instructor}</div>
      </div>

      <div className="entry-container">
        <RateEntry
          heading="Overall Rating"
          variant="stars"
          oneStarLabel="Awful"
          fiveStarLabel="Awesome"
          value={overallRating}
          onChange={handleOverallChange}
        />
        <RateEntry
          heading="Level of Difficulty"
          variant="stars"
          oneStarLabel="Very Easy"
          fiveStarLabel="Very Difficult"
          value={levelOfDifficulty}
          onChange={handleDifficultyChange}
        />
        <RateEntry
          heading="Workload per Week"
          variant="time"
          value={workload}
          limits={{
            hours: { min: 0, max: 167 },
            minutes: { min: 0, max: 59 },
          }}
          onChange={handleWorkloadChange}
        />
      </div>
    </div>
  );
}
