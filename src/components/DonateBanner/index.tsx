import React, { useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { classes } from '../../utils/misc';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

// Key to mark when a user has already been shown the information modal.
// Update this when updating the contents of the modal.
const BANNER_LOCAL_STORAGE_KEY = '2023-04-05-spr2024-donate-banner';
const OUTDATED_LOCAL_STORAGE_KEY = [
  '2023-04-05-spr2024-donate-banner',
  '2021-10-27-spr2022-schedule-versions-account-sync',
  '2023-03-05-spr2023-oscar-migration',
];

/**
 * Component that shows the information modal
 * upon the user's first visit to the site
 * when they haven't seen this version of the information modal before.
 */
export default function DonateBanner(): React.ReactElement {
  const [show, setShow] = useState(false);
  const [hasSeen, setHasSeen] = useLocalStorageState(BANNER_LOCAL_STORAGE_KEY, {
    defaultValue: false,
    storageSync: true,
  });
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  OUTDATED_LOCAL_STORAGE_KEY.forEach((key) =>
    window.localStorage.removeItem(key)
  );

  useEffect(() => {
    if (!hasSeen) {
      setShow(true);
      setHasSeen(true);
    }
  }, [hasSeen, setHasSeen]);

  return (
    <div>
      <p>Donate now!</p>
    </div>
  );
}
