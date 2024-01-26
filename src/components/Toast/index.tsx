import React from 'react';

import { Id, ToastContainer, toast } from 'react-toastify';

import './stylesheet.scss';
import 'react-toastify/dist/ReactToastify.css';
import { classes } from '../../utils/misc';

export type ToastProps = {
  style?: React.CSSProperties;
  className?: string;
  color?: string;
  icon?: string;
};

export default function Toast({
  style,
  className,
  color = 'red',
  icon = '',
}: ToastProps): React.ReactElement {
  const notify = (): Id => toast('Wow so easy!');

  return (
    <div>
      <button type="button" onClick={notify}>
        Notify!
      </button>
      <ToastContainer className={classes('toast', className)} />
    </div>
  );
}
