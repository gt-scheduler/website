import React, { useCallback, useState } from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { classes } from '../../utils';
import './stylesheet.scss';
import { CourseFilter, CourseFilterDropDown } from '..';

export default function CourseFilterNested({
  name,
  data,
  filters,
  setFilters
}) {
  const [expanded, setExpanded] = useState(false);
  const handleToggleFilter = useCallback(
    (key, tag) => {
      const tags = filters[key];
      setFilters({
        ...filters,
        [key]: tags.includes(tag)
          ? tags.filter((v) => v !== tag)
          : [...tags, tag]
      });
    },
    [filters, setFilters]
  );

  const handleResetFilter = useCallback(
    (key) => {
      setFilters({
        ...filters,
        [key]: []
      });
    },
    [filters, setFilters]
  );

  return (
    <div className="CourseFilterNested">
      <div
        // check active className setting
        className={classes('header')}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="name">{name}</div>
        <FontAwesomeIcon fixedWidth icon={expanded ? faAngleUp : faAngleDown} />
      </div>
      {expanded && (
        <div>
          {Object.keys(data).map((key) =>
            data[key].type !== 'dropdown' ? (
              <CourseFilter
                key={data[key].property}
                name={key}
                labels={Object.keys(data[key])
                  .filter((k) => k !== 'property' && k !== 'type')
                  .reduce((obj, k) => {
                    obj[k] = data[key][k];
                    return obj;
                  }, {})}
                selectedTags={filters[data[key].property]}
                onReset={() => handleResetFilter(data[key].property)}
                onToggle={(tag) => handleToggleFilter(data[key].property, tag)}
                alwaysExpand
              />
            ) : (
              <CourseFilterDropDown
                key={data[key].property}
                name={key}
                labels={Object.keys(data[key])
                  .filter((k) => k !== 'property' && k !== 'type')
                  .reduce((obj, k) => {
                    obj[k] = data[key][k];
                    return obj;
                  }, {})}
                selectedTag={filters[data[key].property]}
                onToggle={(tag) =>
                  setFilters({
                    ...filters,
                    [data[key].property]: tag
                  })
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
