import React, { useMemo } from 'react';

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
  // Use approach from this article
  // to stablize spinner position over time
  // when it resides at the same place between renders:
  // https://dev.to/selbekk/how-to-stop-your-spinner-from-jumping-in-react-5cmp
  const mountTime = useMemo(() => Date.now(), []);
  // This must be the same as animation duration:
  const mountDelay = -(mountTime % 800);
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
          '--spinner-delay': `${mountDelay.toFixed(3)}ms`,
        } as React.CSSProperties
      }
      viewBox="0 0 50 50"
    >
      <circle cx="25" cy="25" r="20" />
    </svg>
  );
}
