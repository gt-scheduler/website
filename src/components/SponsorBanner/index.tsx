import React from 'react';

import Banner from '../Banner';

const BANNER_LOCAL_STORAGE_KEY = '2026-03-03-mechanize-survey-banner';
const SPONSOR_LINK =
  'https://jobs.ashbyhq.com/mechanize?utm_source=gt-scheduler';

function Content(): React.ReactElement {
  return (
    <span>
      Mechanize is hiring. 250k base + equity.{' '}
      <a
        className="bannerButton"
        href={SPONSOR_LINK}
        rel="noopener noreferrer"
        target="_blank"
      >
        <b className="buttonText">Apply now.</b>
      </a>
    </span>
  );
}

export default function SurveyBanner(): React.ReactElement {
  return (
    <Banner
      localStorageKey={BANNER_LOCAL_STORAGE_KEY}
      content={<Content />}
      mobileContent={<Content />}
    />
  );
}
