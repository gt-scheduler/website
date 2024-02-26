import React from 'react';
import { faWarning, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

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
    setTimeout(() => {
      t.style.animation = 'fadeout 0.5s';
    }, 5000);
  }
}

export default function Toast({
  className,
  color = 'orange',
  icon = faWarning,
  message = '',
  selfDisappearing = true,
}: ToastProps): React.ReactElement {
  const handleAnimationEnd = (
    event: React.AnimationEvent<HTMLDivElement>
  ): void => {
    if (event.animationName === 'fadeout') {
      const t = event.target as HTMLElement;
      t.style.visibility = 'hidden';
    }
  };

  return (
    <div
      className={classes('toast', className)}
      style={{ backgroundColor: color }}
      onAnimationEnd={handleAnimationEnd}
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
          }}
        />
      )}
    </div>
  );
}
