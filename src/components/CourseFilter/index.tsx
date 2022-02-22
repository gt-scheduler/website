/* eslint-disable no-multi-assign */
/* eslint-disable react/self-closing-comp */
import React, { useState } from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { classes, humanizeArrayReact } from '../../utils/misc';

import './stylesheet.scss';

export type CourseFilterProps = {
  name: string;
  labels: Record<string, string>;
  selectedTags: string[];
  onReset: () => void;
  onToggle: (tag: string) => void;
};

export default function CourseFilter({
  name,
  labels,
  selectedTags,
  onReset,
  onToggle,
}: CourseFilterProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const string2 = name === 'Credit Hours & Class Times';
  const buttonNumber = 4;
  let boolValue = false;
  const flipSwitch = (boolValue = !boolValue);

  return (
    <div className="CourseFilter">
      <div
        className={classes('header', selectedTags.length > 0 && 'active')}
        onClick={(): void => setExpanded(!expanded)}
      >
        {!expanded && selectedTags.length > 0 ? (
          <div className="name">
            {humanizeArrayReact(
              selectedTags.flatMap<string>((tag) => {
                const selectedTag = labels[tag];
                return selectedTag != null ? [selectedTag] : [];
              }),
              <span className="or">or</span>
            )}
          </div>
        ) : (
          <div className="name">{name}</div>
        )}
        <FontAwesomeIcon fixedWidth icon={expanded ? faAngleUp : faAngleDown} />
      </div>
      {expanded && (
        <div className="tag-container">
          <div
            className={classes('tag', selectedTags.length === 0 && 'active')}
            onClick={onReset}
          >
            All
          </div>
          {Object.keys(labels).map((tag) => (
            <div>
              <div className="jo">
                {labels[tag] === 'All' && (
                  <div>
                    <p>5</p>
                  </div>
                )}
              </div>
              <div className="buttonContainer">
                <div
                  key={tag}
                  className={classes(
                    'tag',
                    selectedTags.includes(tag) && 'active'
                  )}
                  property={tag}
                  onClick={(): void => onToggle(tag)}
                >
                  {labels[tag]}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
