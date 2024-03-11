import React from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type ButtonProps = {
  className?: string;
  disabled?: boolean;
  href?: string;
  onClick?: (e: React.SyntheticEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
  id?: string;
};

export default function Button({
  className,
  disabled = false,
  href,
  onClick,
  children,
  id,
}: ButtonProps): React.ReactElement {
  if (disabled)
    return (
      <div className={classes('Button', 'disabled', className)} id={id}>
        {children}
      </div>
    );

  if (href != null)
    return (
      <a
        className={classes('Button', className)}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        id={id}
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
        if (event.key === 'Enter' && onClick != null) onClick(event);
      }}
      role="button"
      id={id}
    >
      {children}
    </div>
  );
}
