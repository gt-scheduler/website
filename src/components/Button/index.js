import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { classes } from '../../utils';
import './stylesheet.scss';

export function Button({ className, disabled, text, href, onClick, children }) {
  return disabled ? (
    <div className={classes('Button', 'disabled')}>
      {children}
    </div>
  ) : href ? (
    <a className={classes('Button', className)} href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  ) : text ? (
    <CopyToClipboard text={text}>
      <div className={classes('Button', className)}>
        {children}
      </div>
    </CopyToClipboard>
  ) : (
    <div className={classes('Button', className)} onClick={onClick}>
      {children}
    </div>
  );
}
