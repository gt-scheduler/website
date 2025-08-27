import React from 'react';

import Banner from '../Banner';
import { DONATE_LINK } from '../../constants';

const BANNER_LOCAL_STORAGE_KEY = '2024-04-01-spr2024-donate-banner';

function Content(): React.ReactElement {
  return (
    <span>
      Help keep GT Scheduler and its amazing features running!
      <a
        className="bannerButton"
        href={DONATE_LINK}
        rel="noopener noreferrer"
        target="_blank"
      >
        <b className="buttonText">Donate Today.</b>
      </a>
    </span>
  );
}

function MobileContent(): React.ReactElement {
  return (
    <span>
      Help us and
      <a
        className="bannerButton"
        href={DONATE_LINK}
        rel="noopener noreferrer"
        target="_blank"
      >
        <b className="buttonText">donate today.</b>
      </a>
    </span>
  );
}

export default function DonateBanner(): React.ReactElement {
  return (
    <Banner
      localStorageKey={BANNER_LOCAL_STORAGE_KEY}
      content={<Content />}
      mobileContent={<MobileContent />}
    />
  );
}
