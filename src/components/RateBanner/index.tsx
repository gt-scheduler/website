import React, { useContext } from 'react';

import Banner from '../Banner';
import { getSemesterName } from '../../utils/semesters';
import { AppNavigationContext } from '../App/navigation';

const BANNER_LOCAL_STORAGE_KEY = '2026-02-25-spring2026-rate-courses-banner';

function Content(): React.ReactElement {
  const { setTab } = useContext(AppNavigationContext);
  return (
    <span onClick={(): void => setTab('Ratings', { overrideTerm: '202602' })}>
      Rate {getSemesterName('202602')} courses
    </span>
  );
}

export default function RateBanner(): React.ReactElement {
  return (
    <Banner localStorageKey={BANNER_LOCAL_STORAGE_KEY} content={<Content />} />
  );
}
