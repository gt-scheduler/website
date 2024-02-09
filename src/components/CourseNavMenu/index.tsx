import React from 'react';

import { Tab } from '..';
import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type CourseNavMenuProps = {
  items: string[];
  currentItem: number;
  onChangeItem: (next: number) => void;
};

export default function CourseNavMenu({
  items,
  currentItem,
  onChangeItem,
}: CourseNavMenuProps): React.ReactElement {
  return (
    <div className="courseNavMenu">
      {items.map((item, idx) => (
        <Tab
          key={`course-nav-button-${idx}`}
          label={item}
          active={idx === currentItem}
          onClick={(): void => onChangeItem(idx)}
          className={classes(
            'course-nav-button',
            currentItem === idx && 'active'
          )}
        />
      ))}
    </div>
  );
}
