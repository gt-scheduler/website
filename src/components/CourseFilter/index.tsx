import React, { useState } from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { classes, humanizeArray } from '../../utils';
import './stylesheet.scss';
import { SafeRecord } from '../../types';

export type CourseFilterProps = {
  name: string;
  labels: SafeRecord<string, string>;
  selectedTags: string[];
  onReset: () => void;
  onToggle: (tag: string) => void;
};

export default function CourseFilter({
  name,
  labels,
  selectedTags,
  onReset,
  onToggle
}: CourseFilterProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="CourseFilter">
      <div
        className={classes('header', selectedTags.length > 0 && 'active')}
        onClick={() => setExpanded(!expanded)}
      >
        {!expanded && selectedTags.length > 0 ? (
          <div
            className="name"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: humanizeArray(
                selectedTags.flatMap<string>((tag) => {
                  const selectedTag = labels[tag];
                  return selectedTag != null ? [selectedTag] : [];
                }),
                '<span class="or">or</span>'
              )
            }}
          />
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
            <div
              key={tag}
              className={classes('tag', selectedTags.includes(tag) && 'active')}
              property={tag}
              onClick={() => onToggle(tag)}
            >
              {labels[tag]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
