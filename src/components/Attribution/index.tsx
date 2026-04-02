import React from 'react';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '..';
import { classes, getFullYear } from '../../utils/misc';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

function ExternalLink({
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>): React.ReactElement {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

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
        &nbsp;by{' '}
        <ExternalLink href="https://jasonpark.me">Jinseo Park</ExternalLink>,{' '}
        <ExternalLink href="https://bitsofgood.org">Bits of Good</ExternalLink>,
        and{' '}
        <ExternalLink href="https://github.com/gt-scheduler/website/graphs/contributors">
          the GT Scheduler contributors
        </ExternalLink>
        . Sponsored by{' '}
        <ExternalLink href="https://www.mechanize.work/">
          Mechanize
        </ExternalLink>
        .
      </p>
      <p>&nbsp;</p>
    </div>
  );
}
