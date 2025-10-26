import React from 'react';

import Banner from '../Banner';

const BANNER_LOCAL_STORAGE_KEY =
  '2025-09-25-fall2025-course-details-survey-banner';
const SURVEY_LINK =
  'https://gatech.co1.qualtrics.com/jfe/form/SV_0wwncvjPzzI8Q9E';

function Content(): React.ReactElement {
  return (
    <span>
      Help us create our new course page!
      <a
        className="bannerButton"
        href={SURVEY_LINK}
        rel="noopener noreferrer"
        target="_blank"
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
        href={SURVEY_LINK}
        rel="noopener noreferrer"
        target="_blank"
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
