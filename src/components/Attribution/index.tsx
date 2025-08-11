import React from 'react';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '..';
import { classes, getFullYear } from '../../utils/misc';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

export default function Attribution(): React.ReactElement {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);
  const year = getFullYear();
  return (
    <div className={classes('Attribution')}>
      {!mobile ? (
        <Button href="https://github.com/gt-scheduler/website">
          <FontAwesomeIcon fixedWidth icon={faGithub} size="2xl" />
          <span className="githubText">GitHub</span>
        </Button>
      ) : (
        <div />
      )}

      <p>
        Copyright (c) {year} with&nbsp;
        <span role="img" aria-label="love">
          ❤️
        </span>
        &nbsp;by <a href="https://jasonpark.me">Jinseo Park</a>,&nbsp;
        <a href="https://bitsofgood.org">Bits of Good</a>, and&nbsp;
        <a href="https://github.com/gt-scheduler/website/graphs/contributors">
          {mobile ? 'others' : 'the GT Scheduler contributors'}
        </a>
        .
      </p>
      <p>&nbsp;</p>
    </div>
  );
}
