import React from 'react';

import './stylesheet.scss';

export type CourseFilterProps = {
  name: string;
  labels: Array<string>;
  selectedTags: string[];
  onReset: () => void;
  onToggle: (tag: string) => void;
};

export default function CourseSubFilterDropdown({
  name,
  labels,
}: CourseFilterProps): React.ReactElement {
  return (
    <div className="CourseSubFilterDropdown">
      <div className="tag-sub-container">
        <div className="subTitle">
          <p>{name}</p>
        </div>
        <div>
          <div className="buttonContainer">
            <select name="startTime" id="startTime" className="tag">
              {labels.map((label) => (
                <option value={label}> {label} </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
