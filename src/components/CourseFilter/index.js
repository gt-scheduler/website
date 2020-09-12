import React, { useState } from 'react';
import { classes, humanizeArray } from '../../utils';
import './stylesheet.scss';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function CourseFilter({
  name,
  labels,
  selectedTags,
  onReset,
  onToggle
}) {
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
            dangerouslySetInnerHTML={{
              __html: humanizeArray(
                selectedTags.map((tag) => labels[tag]),
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
