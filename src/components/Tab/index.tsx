import React from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type TabProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Renders a single top-level tab that is used in a horizontal list
 */
export default function Tab({
  label,
  active = false,
  onClick,
  className,
  style,
}: TabProps): React.ReactElement {
  return (
    <button
      className={classes('Tab', active && 'active', className)}
      style={style}
      onClick={onClick}
      type="button"
      id={label}
    >
      {label}
    </button>
  );
}
