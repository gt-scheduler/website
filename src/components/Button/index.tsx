import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { classes } from '../../utils';
import './stylesheet.scss';

export type ButtonProps = {
  className?: string;
  disabled?: boolean;
  text?: string;
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export function Button({
  className,
  disabled = false,
  text,
  href,
  onClick,
  children
}: ButtonProps) {
  if (disabled)
    return <div className={classes('Button', 'disabled')}>{children}</div>;

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

  if (text != null)
    return (
      <CopyToClipboard text={text}>
        <div className={classes('Button', className)}>{children}</div>
      </CopyToClipboard>
    );

  return (
    <div
      className={classes('Button', className)}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(event) => {
        // Intercept enter presses
        if (event.key === 'Enter' && onClick != null) onClick();
      }}
      role="button"
    >
      {children}
    </div>
  );
}
