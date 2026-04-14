import React, { useState, useEffect } from 'react';

import Banner from '../Banner';

const BANNER_LOCAL_STORAGE_KEY = '2026-04-14-mechanize-survey-banner';
const SPONSOR_LINK =
  'https://jobs.ashbyhq.com/mechanize?utm_source=gt-scheduler';

const SLOGANS = [
  'Better at coding than AI? Prove it. Mechanize: $300k + equity.',
  'Mechanize is hiring junior software engineers. 300k base + equity.',
  "We hire engineers to outsmart AI. It's harder than you think. $300k + equity.",
  "Most engineers can't beat Claude on our take-home. Think you can? $300k + equity for junior SWEs at Mechanize.",
];

function Content({ text }: { text: string }): React.ReactElement {
  return (
    <span>
      {text}{' '}
      <a
        className="bannerButton"
        href={SPONSOR_LINK}
        rel="noopener noreferrer"
        target="_blank"
      >
        <b className="buttonText">Apply now!</b>
      </a>
    </span>
  );
}

export default function SponsorBanner(): React.ReactElement | null {
  const [slogan, setSlogan] = useState(SLOGANS[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SLOGANS.length);
    setSlogan(SLOGANS[randomIndex]);
  }, []);

  if (!slogan) {
    return null;
  }

  return (
    <Banner
      localStorageKey={BANNER_LOCAL_STORAGE_KEY}
      content={<Content text={slogan} />}
      mobileContent={<Content text={slogan} />}
    />
  );
}
