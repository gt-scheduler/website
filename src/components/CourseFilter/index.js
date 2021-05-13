import React, { useState } from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { classes, humanizeArray } from '../../utils';
import './stylesheet.scss';

export default function CourseFilter({
  name,
  labels,
  selectedTags,
  onReset,
  onToggle,
  alwaysExpand = false
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="CourseFilter">
      {alwaysExpand ? (
        <div>
          <div
            className={classes('header', selectedTags.length > 0 && 'active')}
          >
            <div className="name">{name}</div>
          </div>
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
                className={classes(
                  'tag',
                  selectedTags.includes(tag) && 'active'
                )}
                property={tag}
                onClick={() => onToggle(tag)}
              >
                {labels[tag]}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
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
                    selectedTags.map((tag) => labels[tag]),
                    '<span class="or">or</span>'
                  )
                }}
              />
            ) : (
              <div className="name">{name}</div>
            )}
            <FontAwesomeIcon
              fixedWidth
              icon={expanded ? faAngleUp : faAngleDown}
            />
          </div>
          {expanded && (
            <div className="tag-container">
              <div
                className={classes(
                  'tag',
                  selectedTags.length === 0 && 'active'
                )}
                onClick={onReset}
              >
                All
              </div>
              {Object.keys(labels).map((tag) => (
                <div
                  key={tag}
                  className={classes(
                    'tag',
                    selectedTags.includes(tag) && 'active'
                  )}
                  property={tag}
                  onClick={() => onToggle(tag)}
                >
                  {labels[tag]}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
