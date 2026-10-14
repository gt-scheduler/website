import React from 'react';

import Banner from '../Banner';

import './stylesheet.scss';

const SPONSOR_LINK = 'https://reliaquest.com/careers/show-up-ready-to-perform';

function Content(): React.ReactElement {
  return (
    <span>
      Exploring What&apos;s Next for your Career?
      <a
        className="bannerButton"
        href={SPONSOR_LINK}
        rel="noopener noreferrer"
        target="_blank"
      >
        <img className="sponsorLogo" alt="ReliaQuest" src="/reliaquest.png" />
      </a>
    </span>
  );
}

export default function SponsorBanner(): React.ReactElement {
  return <Banner content={<Content />} />;
}
