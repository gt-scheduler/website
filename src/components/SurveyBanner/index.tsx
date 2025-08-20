import React from 'react';

import Banner from '../Banner';

const BANNER_LOCAL_STORAGE_KEY = '2025-08-19-fall2025-survey-banner';

function Content(): React.ReactElement {
  return (
    <span>
      Help shape the future of GT Scheduler!
      <a
        className="bannerButton"
        href="https://gatech.co1.qualtrics.com/jfe/form/SV_d7tz8mwG0NP2CF0"
      >
        <b className="buttonText">Take our quick survey.</b>
      </a>
    </span>
  );
}

function MobileContent(): React.ReactElement {
  return (
    <span>
      Help us improve and
      <a
        className="bannerButton"
        href="https://gatech.co1.qualtrics.com/jfe/form/SV_d7tz8mwG0NP2CF0"
      >
        <b className="buttonText">take our quick survey.</b>
      </a>
    </span>
  );
}

export default function SurveyBanner(): React.ReactElement {
  return (
    <Banner
      localStorageKey={BANNER_LOCAL_STORAGE_KEY}
      content={<Content />}
      mobileContent={<MobileContent />}
    />
  );
}
