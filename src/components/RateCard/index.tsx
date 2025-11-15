import React, { useState } from 'react';

import { classes } from '../../utils/misc';
import RateEntry, { StarsValue, TimeValue } from '../RateEntry';
import {
  MetricName,
  SubmitMetricsRequestData,
  TargetType,
} from '../../data/types';

import './stylesheet.scss';

type RateCardProps = {
  course: string;
  section: string;
  instructor: string;
  onChange: (data: Partial<SubmitMetricsRequestData>) => void;
};

export default function RateCard({
  course,
  section,
  instructor,
  onChange,
}: RateCardProps): React.ReactElement {
  const [overallRating, setOverallRating] = useState<StarsValue>(null);
  const [levelOfDifficulty, setLevelOfDifficulty] = useState<StarsValue>(null);
  const [workload, setWorkload] = useState<TimeValue>({
    hours: null,
    minutes: null,
  });

  function buildData(
    overall: StarsValue,
    difficulty: StarsValue,
    workloadValue: TimeValue
  ): Partial<SubmitMetricsRequestData> {
    const targets = [
      { type: TargetType.COURSE, reference: course },
      { type: TargetType.SECTION, reference: section },
      { type: TargetType.PROFESSOR, reference: instructor },
    ];

    const values: number[] = [];
    if (overall != null) values.push(overall);
    if (difficulty != null) values.push(difficulty);
    if (workloadValue.hours != null || workloadValue.minutes != null) {
      const totalMinutes =
        (workloadValue.hours ?? 0) * 60 + (workloadValue.minutes ?? 0);
      values.push(totalMinutes);
    }

    return {
      metricName: MetricName.DIFFICULTY,
      targets,
      values,
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
