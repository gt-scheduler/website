import React, { ChangeEvent } from 'react';

import { ANY_TIME } from '../../constants';

import './stylesheet.scss';

export type CourseFilterProps = {
  name: string;
  labels: Record<string, number>;
  selectedTags: string[];
  onReset: () => void;
  onToggle: (tagArr: string[]) => void;
};

export default function CourseSubFilterDropdown({
  name,
  labels,
  onToggle,
}: CourseFilterProps): React.ReactElement {
  const dropdownToggleHandler = (e: ChangeEvent<HTMLSelectElement>): void => {
    const val = e.target.value;
    if (val === ANY_TIME) onToggle([]);
    else onToggle([val]);
  };

  return (
    <div className="CourseSubFilterDropdown">
      <div className="tag-sub-container">
        <div className="subTitle">
          <p>{name}</p>
        </div>
        <div>
          <div className="buttonContainer">
            <select
              name="startTime"
              id="startTime"
              className="tag"
              onChange={dropdownToggleHandler}
            >
              <option value={ANY_TIME}> {ANY_TIME} </option>
              {Object.keys(labels).map((label) => (
                <option value={labels[label]}> {label} </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
