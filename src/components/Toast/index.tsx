import React from 'react';
import { faWarning, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type ToastProps = {
  id: string;
  className?: string;
  color?: string;
  icon?: IconProp;
  message?: string;
  selfDisappearing?: boolean;
};

export function notifyToast(id: string): void {
  const t = document.getElementById(id) as HTMLElement;

  const selfDisappearing = !t.getElementsByClassName('toast-close-icon')[0];
  t.style.visibility = 'visible';
  t.style.animation =
    window.innerWidth <= 450 ? 'fadein-mobile 0.5s' : 'fadein 0.5s';
  if (selfDisappearing) {
    setTimeout(() => {
      t.style.animation =
        window.innerWidth <= 450 ? 'fadeout-mobile 0.5s' : 'fadeout 0.5s';
    }, 5000);
  }
}

export default function Toast({
  id,
  className,
  color = 'orange',
  icon = faWarning,
  message = '',
  selfDisappearing = true,
}: ToastProps): React.ReactElement {
  const handleAnimationEnd = (
    event: React.AnimationEvent<HTMLDivElement>
  ): void => {
    if (
      event.animationName === 'fadeout' ||
      event.animationName === 'fadeout-mobile'
    ) {
      const t = event.target as HTMLElement;
      t.style.visibility = 'hidden';
    }
  };

  return (
    <div
      className={classes('toast', className)}
      style={{ backgroundColor: color }}
      onAnimationEnd={handleAnimationEnd}
      id={id}
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
            t.style.animation =
              window.innerWidth <= 450 ? 'fadeout-mobile 0.5s' : 'fadeout 0.5s';
          }}
        />
      )}
    </div>
  );
}
