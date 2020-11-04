import React from 'react';
import { classes } from '../../utils';

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
const Tab = ({
  label,
  active = false,
  onClick,
  className,
  style
}: TabProps) => (
  <button
    className={classes('Tab', active && 'active', className)}
    style={style}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);

export default Tab;
