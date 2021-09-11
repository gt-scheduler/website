import React from 'react';

import { Button } from '..';
import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type NavMenuProps = {
  items: string[];
  currentItem: number;
  onChangeItem: (next: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Renders a vertical nav menu with a single active item
 */
export default function NavMenu({
  items,
  currentItem,
  onChangeItem,
  className,
  style,
}: NavMenuProps): React.ReactElement {
  return (
    <div className={classes('nav-menu', className)} style={style}>
      {items.map((item, idx) => (
        <Button
          className={classes('nav-button', currentItem === idx && 'active')}
          onClick={(): void => onChangeItem(idx)}
          key={idx}
        >
          {item}
        </Button>
      ))}
    </div>
  );
}
