import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    const targets = [
      { type: TargetType.COURSE, reference: course },
      { type: TargetType.SECTION, reference: section },
      { type: TargetType.PROFESSOR, reference: instructor },
    ];

    const values: number[] = [];
    if (overallRating != null) values.push(overallRating);
    if (levelOfDifficulty != null) values.push(levelOfDifficulty);
    if (workload.hours != null || workload.minutes != null) {
      const totalMinutes = (workload.hours ?? 0) * 60 + (workload.minutes ?? 0);
      values.push(totalMinutes);
    }

    const data: Partial<SubmitMetricsRequestData> = {
      metricName: MetricName.DIFFICULTY,
      targets,
      values,
    };

    onChange(data);
  }, [overallRating, levelOfDifficulty, workload]);

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
          onChange={setOverallRating}
        />
        <RateEntry
          heading="Level of Difficulty"
          variant="stars"
          oneStarLabel="Very Easy"
          fiveStarLabel="Very Difficult"
          value={levelOfDifficulty}
          onChange={setLevelOfDifficulty}
        />
        <RateEntry
          heading="Workload per Week"
          variant="time"
          value={workload}
          limits={{
            hours: { min: 0, max: 167 },
            minutes: { min: 0, max: 59 },
          }}
          onChange={setWorkload}
        />
      </div>
    </div>
  );
}
