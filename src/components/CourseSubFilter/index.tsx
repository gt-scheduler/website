import React from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type CourseFilterProps = {
  name: string;
  labels: Array<string>;
  selectedTags: string[];
  onReset: () => void;
  onToggle: (tag: string) => void;
};

export default function CourseSubFilter({
  name,
  labels,
  selectedTags,
  onReset,
  onToggle,
}: CourseFilterProps): React.ReactElement {
  return (
    <div className="CourseSubFilter">
      <div className="tag-sub-container">
        <div className="subTitle">
          <p>{name}</p>
        </div>
        <div>
          <div className="buttonContainer">
            <div
              className={classes('tag', selectedTags.length === 0 && 'active')}
              onClick={onReset}
            >
              All
            </div>
            {labels.map((tag) => (
              <div
                key={tag}
                className={classes(
                  'tag',
                  selectedTags.includes(tag) && 'active'
                )}
                property={tag}
                onClick={(): void => onToggle(tag)}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
