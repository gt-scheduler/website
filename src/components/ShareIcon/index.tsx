import React from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export interface ShareIconProps {
  className: string;
}

export default function ShareIcon({ className }: ShareIconProps): JSX.Element {
  return (
    <svg
      className={classes(className, 'share-icon')}
      width="14"
      height="20"
      viewBox="0 0 14 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.5 3.63636L9.2575 4.92727L7.86625 3.48182V13.6364H6.13375V3.48182L4.7425 4.92727L3.5 3.63636L7 0L10.5 3.63636ZM14 8.18182V18.1818C14 19.1818 13.2125 20 12.25 20H1.75C1.28587 20 0.840752 19.8084 0.512563 19.4675C0.184374 19.1265 0 18.664 0 18.1818V8.18182C0 7.17273 0.77875 6.36364 1.75 6.36364H4.375V8.18182H1.75V18.1818H12.25V8.18182H9.625V6.36364H12.25C12.7141 6.36364 13.1592 6.55519 13.4874 6.89617C13.8156 7.23715 14 7.69961 14 8.18182Z" />
    </svg>
  );
}
