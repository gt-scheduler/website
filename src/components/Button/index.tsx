import React from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type ButtonProps = {
  className?: string;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export default function Button({
  className,
  disabled = false,
  href,
  onClick,
  children,
}: ButtonProps): React.ReactElement {
  if (disabled)
    return (
      <div className={classes('Button', 'disabled', className)}>{children}</div>
    );

  if (href != null)
    return (
      <a
        className={classes('Button', className)}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );

  return (
    <div
      className={classes('Button', className)}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(event): void => {
        // Intercept enter presses
        if (event.key === 'Enter' && onClick != null) onClick();
      }}
      role="button"
    >
      {children}
    </div>
  );
}
