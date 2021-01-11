import React from 'react';
import './stylesheet.scss';
import { classes } from '../../utils';
import { useMobile } from '../../hooks';

export default function Attribution() {
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
        <a href="https://github.com/GTBitsOfGood/gt-scheduler/graphs/contributors">
          {mobile ? 'others' : 'the GT Scheduler contributors'}
        </a>
        .
      </p>
    </div>
  );
}
