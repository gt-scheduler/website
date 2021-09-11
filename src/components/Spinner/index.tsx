import React from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type SpinnerProps = {
  style?: React.CSSProperties;
  className?: string;
  size?: 'small' | 'normal' | number;
};

/**
 * Shows a simple circular spinner with a configurable size,
 * designed to indicate loading.
 */
export default function Spinner({
  style,
  className,
  size = 'normal',
}: SpinnerProps): React.ReactElement {
  const actualSize =
    typeof size === 'number'
      ? size
      : {
          small: 16,
          normal: 40,
        }[size];
  return (
    <svg
      className={classes('spinner', className)}
      style={
        {
          ...style,
          '--size': `${actualSize}px`,
        } as React.CSSProperties
      }
      viewBox="0 0 50 50"
    >
      <circle cx="25" cy="25" r="20" />
    </svg>
  );
}
