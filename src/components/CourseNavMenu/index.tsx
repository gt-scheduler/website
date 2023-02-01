import React from 'react';

import { Tab } from '..';
import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type CourseNavMenuProps = {
  items: string[];
  currentItem: number;
  onChangeItem: (next: number) => void;
  style?: React.CSSProperties;
};

export default function CourseNavMenu({
  items,
  currentItem,
  onChangeItem,
  style,
}: CourseNavMenuProps): React.ReactElement {
  return (
    <div className="course-nav-menu" style={style}>
      {items.map((item, idx) => (
        <Tab
          label={item}
          active={idx === currentItem}
          onClick={(): void => onChangeItem(idx)}
          className={classes(
            'course-nav-button',
            currentItem === idx && 'active'
          )}
          style={style}
        />
      ))}
    </div>
  );
}
