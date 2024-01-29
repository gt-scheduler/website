import React from 'react';

import './stylesheet.scss';
import { classes } from '../../utils/misc';
import { faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export type ToastProps = {
  style?: React.CSSProperties;
  className?: string;
  color?: string;
  icon?: IconProp;
  message?: string;
};

export default function Toast({
  style,
  className,
  color = 'red',
  icon = faWarning,
  message = '',
}: ToastProps): React.ReactElement {
  function notify(): void {
    const x = document.getElementById('toast');
    x!.className = 'show';
    setTimeout(function () {
      x!.className = x!.className.replace('show', '');
    }, 3000);
  }

  return (
    <div>
      <button type="button" onClick={notify}>
        Show Snackbar
      </button>
      <div id="toast" style={{ backgroundColor: color }}>
        <FontAwesomeIcon fixedWidth icon={icon} className="toast-icon" />
        {message}
      </div>
      <div className={classes('toast', className)} />
    </div>
  );
}
