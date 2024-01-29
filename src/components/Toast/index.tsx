import React from 'react';

import './stylesheet.scss';
import { classes } from '../../utils/misc';
import { faWarning, faClose } from '@fortawesome/free-solid-svg-icons';
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
    x!.style.visibility = 'visible';
    x!.style.animation = 'fadein 0.5s';
  }

  return (
    <div>
      <button type="button" onClick={notify}>
        Show Toast
      </button>
      <div id="toast" style={{ backgroundColor: color }}>
        <FontAwesomeIcon fixedWidth icon={icon} className="toast-icon" />
        <div className="toast-message">{message}</div>
        <FontAwesomeIcon
          fixedWidth
          icon={faClose}
          className="toast-close-icon"
          onClick={(): void => {
            const x = document.getElementById('toast');
            x!.style.animation = 'fadeout 0.5s';
            setTimeout(function () {
              x!.style.visibility = 'hidden';
            }, 500);
          }}
        />
      </div>
      <div className={classes('toast', className)} />
    </div>
  );
}
