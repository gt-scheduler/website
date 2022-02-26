import React, { useState } from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { classes, humanizeArrayReact } from '../../utils/misc';
import { CLASS_TIMESTAMPS } from '../../constants';

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
  const isCreditHourFilter = name === 'Credit Hours & Class Times';
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
          <div>
            {!isCreditHourFilter && (
              <div className="buttonContainer">
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
                  <div>
                    <div>
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
          <div>
            {isCreditHourFilter && (
              <div className="subTitle">
                <p>Credit Hours</p>
              </div>
            )}
          </div>
          <div>
            {isCreditHourFilter && (
              <div className="buttonContainer">
                <div
                  className={classes(
                    'tag',
                    selectedTags.length === 0 && 'active'
                  )}
                  onClick={onReset}
                >
                  All
                </div>
                {Object.keys(labels)
                  .slice(0, 5)
                  .map((tag) => (
                    <div>
                      <div>
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
          <div>
            {isCreditHourFilter && (
              <div className="subTitle">
                <p>Days</p>
              </div>
            )}
          </div>
          <div>
            {isCreditHourFilter && (
              <div className="buttonContainer">
                <div
                  className={classes(
                    'tag',
                    selectedTags.length === 0 && 'active'
                  )}
                  onClick={onReset}
                >
                  All
                </div>
                {Object.keys(labels)
                  .slice(5, 10)
                  .map((tag) => (
                    <div>
                      <div>
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
          <div>
            <div className="timeTitles">
              <div>
                {isCreditHourFilter && (
                  <div className="startSubTitle">
                    <p>Start After</p>
                  </div>
                )}
              </div>

              <div>
                {isCreditHourFilter && (
                  <div className="endSubTitle">
                    <p>End After</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            {isCreditHourFilter && (
              <div className="buttonContainer">
                {Object.keys(labels)
                  .slice(10, 12)
                  .map((tag) => (
                    <div>
                      <div>
                        <select
                          key={tag}
                          className={classes(
                            'tag',
                            selectedTags.includes(tag) && 'active'
                          )}
                          property={tag}
                          onClick={(): void => onToggle(tag)}
                        >
                          {CLASS_TIMESTAMPS.map((timestamp) => (
                            <option value={timestamp} key={timestamp}>
                              {' '}
                              {timestamp}{' '}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div>
            {isCreditHourFilter && (
              <div className="subTitle">
                <p>Course Level</p>
              </div>
            )}
          </div>
          <div>
            {isCreditHourFilter && (
              <div className="buttonContainer">
                <div
                  className={classes(
                    'tag',
                    selectedTags.length === 0 && 'active'
                  )}
                  onClick={onReset}
                >
                  All
                </div>
                {Object.keys(labels)
                  .slice(12, 14)
                  .map((tag) => (
                    <div>
                      <div>
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
        </div>
      )}
    </div>
  );
}
