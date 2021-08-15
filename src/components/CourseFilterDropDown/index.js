import React from 'react';
import { classes } from '../../utils';
import './stylesheet.scss';
import { Select } from '../index';

export default function CourseFilterDropDown({
  name,
  labels,
  selectedTag,
  onToggle
}) {
  return (
    <div className="CourseFilterDropDown">
      <div>
        <div
          className={classes(
            'header',
            selectedTag !== Object.values(labels)[0] && 'active'
          )}
        >
          <div className="nameNonBold">{name}</div>
        </div>
        <div className="select-container">
          <Select
            onChange={onToggle}
            value={selectedTag}
            options={Object.keys(labels).map((tag) => ({
              value: tag,
              label: labels[tag]
            }))}
          />
        </div>
      </div>
    </div>
  );
}
