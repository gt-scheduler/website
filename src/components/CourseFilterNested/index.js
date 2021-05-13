import React, { useCallback, useState } from 'react';
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { classes, humanizeArray } from '../../utils';
import './stylesheet.scss';
import { CourseFilter } from '../index';

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
    [filters]
  );

  const handleResetFilter = useCallback(
    (key) => {
      setFilters({
        ...filters,
        [key]: []
      });
    },
    [filters]
  );

  return (
    <div className="CourseFilterNested">
      {Object.keys(data).map((key) => (
        <CourseFilter
          key={data[key].property}
          name={key}
          labels={Object.keys(data[key])
            .filter((k) => k !== 'property')
            .reduce((obj, k) => {
              obj[k] = data[key][k];
              return obj;
            }, {})}
          selectedTags={filters[data[key].property]}
          onReset={() => handleResetFilter(data[key].property)}
          onToggle={(tag) => handleToggleFilter(data[key].property, tag)}
          alwaysExpand
        />
      ))}
    </div>
  );
}
