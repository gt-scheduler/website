import React from 'react';

import './stylesheet.scss';
import { classes } from '../../utils/misc';
import { faWarning, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export type ToastProps = {
  className?: string;
  color?: string;
  icon?: IconProp;
  message?: string;
  selfDisappearing?: boolean;
};

export function notifyToast(className: string): void {
  const t = document.getElementsByClassName(
    classes('toast', className)
  )[0] as HTMLElement;
  const selfDisappearing = !t.getElementsByClassName('toast-close-icon')[0];
  t.style.visibility = 'visible';
  t.style.animation = 'fadein 0.5s';
  if (selfDisappearing) {
    setTimeout(function () {
      t.style.animation = 'fadeout 0.5s';
    }, 5000);
    setTimeout(function () {
      t.style.visibility = 'hidden';
    }, 5500);
  }
}

export default function Toast({
  className,
  color = 'orange',
  icon = faWarning,
  message = '',
  selfDisappearing = false,
}: ToastProps): React.ReactElement {
  return (
    <div
      className={classes('toast', className)}
      style={{ backgroundColor: color }}
    >
      <FontAwesomeIcon fixedWidth icon={icon} className="toast-icon" />
      <div className="toast-message">{message}</div>
      {!selfDisappearing && (
        <FontAwesomeIcon
          fixedWidth
          icon={faClose}
          className="toast-close-icon"
          onClick={(): void => {
            const t = document.getElementsByClassName(
              classes('toast', className)
            )[0] as HTMLElement;
            t.style.animation = 'fadeout 0.5s';
            setTimeout(function () {
              t.style.visibility = 'hidden';
            }, 500);
          }}
        />
      )}
    </div>
  );
}
