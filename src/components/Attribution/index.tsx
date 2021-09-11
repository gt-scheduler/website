import React from 'react';

import { classes } from '../../utils/misc';
import { useMobile } from '../../hooks';

import './stylesheet.scss';

export default function Attribution(): React.ReactElement {
  const mobile = useMobile();
  return (
    <div className={classes('Attribution')}>
      <p>
        Copyright (c) 2021 with{' '}
        <span role="img" aria-label="love">
          ❤️
        </span>{' '}
        by <a href="https://jasonpark.me">Jinseo Park</a>,{' '}
        <a href="https://bitsofgood.org">Bits of Good</a>, and{' '}
        <a href="https://github.com/gt-scheduler/website/graphs/contributors">
          {mobile ? 'others' : 'the GT Scheduler contributors'}
        </a>
        .
      </p>
    </div>
  );
}
