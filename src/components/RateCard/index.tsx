import React, { useState } from 'react';

import { classes } from '../../utils/misc';
import RateEntry, { StarsValue, TimeValue } from '../RateEntry';
import Select from '../Select';
import useSubmitMetrics from '../../data/hooks/useSubmitMetrics';
import {
  MetricName,
  SubmitMetricsRequestData,
  TargetType,
} from '../../data/types';

import './stylesheet.scss';

type RateCardProps = {
  courseOptions: { id: string; label: string }[];
  sectionOptions: { id: string; label: string }[];
  professorOptions: { id: string; label: string }[];
};

export default function RateCard({
  courseOptions,
  sectionOptions,
  professorOptions,
}: RateCardProps): React.ReactElement {
  const [overallRating, setOverallRating] = useState<StarsValue>(null);
  const [levelOfDifficulty, setLevelOfDifficulty] = useState<StarsValue>(null);
  const [workload, setWorkload] = useState<TimeValue>({
    hours: null,
    minutes: null,
  });

  const [course, setCourse] = useState(courseOptions[0]?.id ?? '');
  const [section, setSection] = useState(sectionOptions[0]?.id ?? '');
  const [professor, setProfessor] = useState(professorOptions[0]?.id ?? '');

  const [formData, setFormData] = useState<Partial<SubmitMetricsRequestData>>({
    metricName: MetricName.DIFFICULTY,
    targets: [],
    values: [],
  });

  useSubmitMetrics({
    requestData: formData as SubmitMetricsRequestData,
  });

  function submitMetrics(): void {
    const targets = [
      { type: TargetType.COURSE, reference: course },
      { type: TargetType.SECTION, reference: section },
      { type: TargetType.PROFESSOR, reference: professor },
    ];

    const values: number[] = [];
    if (overallRating != null) values.push(overallRating);
    if (levelOfDifficulty != null) values.push(levelOfDifficulty);
    if (workload.hours != null || workload.minutes != null) {
      const totalMinutes = (workload.hours ?? 0) * 60 + (workload.minutes ?? 0);
      values.push(totalMinutes);
    }

    setFormData({
      metricName: MetricName.DIFFICULTY,
      targets,
      values,
    });
  }

  return (
    <div className={classes('ratecard')}>
      <div className="dropdown-container">
        <div className="dropdown-group">
          <div className="dropdown-label">Course:</div>
          <Select
            current={course}
            onChange={setCourse}
            options={courseOptions}
            menuAnchor="left"
          />
        </div>

        <div className="dropdown-group">
          <div className="dropdown-label">Section:</div>
          <Select
            current={section}
            onChange={setSection}
            options={sectionOptions}
            menuAnchor="left"
          />
        </div>

        <div className="dropdown-group">
          <div className="dropdown-label">Professor:</div>
          <Select
            current={professor}
            onChange={setProfessor}
            options={professorOptions}
            menuAnchor="left"
          />
        </div>
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

      <button className="submit-button" type="button" onClick={submitMetrics}>
        Submit
      </button>
    </div>
  );
}
