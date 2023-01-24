import React, { useState } from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import CourseSubFilter from '../CourseSubFilter';
import { classes } from '../../utils/misc';
import {
  CLASS_TIMESTAMPS,
  CREDIT_HOURS,
  DAYS,
  COURSE_LEVEL,
} from '../../constants';
import { SortKey, SortFilter } from '../CourseSearch';
import CourseSubFilterDropdown from '../CourseSubFilterDropdown';

import './stylesheet.scss';

export type CourseFilterProps = {
  onReset: (key: string) => void;
  onToggle: (key: SortKey, tag: string) => void;
  onToggleDropdown: (key: SortKey, tag: string[]) => void;
  filter: SortFilter;
};

export default function CourseFilterByCreditHours({
  onReset,
  onToggle,
  filter,
  onToggleDropdown,
}: CourseFilterProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="CourseFilterByCreditHours">
      <div
        className={classes('header')}
        onClick={(): void => setExpanded(!expanded)}
      >
        <div className="name">Credit Hours {' & '} Class Times</div>
        <FontAwesomeIcon fixedWidth icon={expanded ? faAngleUp : faAngleDown} />
      </div>
      {expanded && (
        <div className="tag-container">
          <CourseSubFilter
            name="Credit Hours"
            labels={CREDIT_HOURS}
            selectedTags={filter.credits}
            onReset={(): void => onReset('credits')}
            onToggle={(tag: string): void => onToggle('credits', tag)}
          />
          <CourseSubFilter
            name="Days"
            labels={DAYS}
            selectedTags={filter.days}
            onReset={(): void => onReset('days')}
            onToggle={(tag: string): void => onToggle('days', tag)}
          />
          <div className="time-container">
            <CourseSubFilterDropdown
              name="Start Time"
              labels={CLASS_TIMESTAMPS}
              selectedTags={filter.startTime}
              onReset={(): void => onReset('startTime')}
              onToggle={(tags: string[]): void =>
                onToggleDropdown('startTime', tags)
              }
            />
            <CourseSubFilterDropdown
              name="End Time"
              labels={CLASS_TIMESTAMPS}
              selectedTags={filter.endTime}
              onReset={(): void => onReset('endTime')}
              onToggle={(tags: string[]): void =>
                onToggleDropdown('endTime', tags)
              }
            />
          </div>
          <CourseSubFilter
            name="Course Level"
            labels={COURSE_LEVEL}
            selectedTags={filter.courseLevel}
            onReset={(): void => onReset('courseLevel')}
            onToggle={(tag: string): void => onToggle('courseLevel', tag)}
          />
        </div>
      )}
    </div>
  );
}
