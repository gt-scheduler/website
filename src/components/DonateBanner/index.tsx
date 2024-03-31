import React, { useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '../Button';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

const BANNER_LOCAL_STORAGE_KEY = '2023-04-05-spr2024-donate-banner';
// const OUTDATED_LOCAL_STORAGE_KEY = [
//   '2023-04-05-spr2024-donate-banner',
//   '2023-04-05-spr2023-new-features-announcement',
//   '2021-10-27-spr2022-schedule-versions-account-sync',
//   '2023-03-05-spr2023-oscar-migration',
// ];

export default function DonateBanner(): React.ReactElement {
  const [show, setShow] = useState(false);
  const [hasSeen, setHasSeen] = useLocalStorageState(BANNER_LOCAL_STORAGE_KEY, {
    defaultValue: false,
    storageSync: true,
  });
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  useEffect(() => {
    if (!hasSeen) {
      setShow(true);
      setHasSeen(true);
    }
  }, [hasSeen, setHasSeen]);

  return (
    <div>
      {show ? (
        <div className="banner">
          <div className="spacer" />
          <span>
            {!mobile
              ? 'Help keep GT Scheduler and its amazing features running!'
              : 'Help us and'}
            <Button
              className="donateButton"
              href="https://donorbox.org/gt-scheduler"
            >
              <b className="buttonText">
                {!mobile ? 'Donate today.' : 'donate today.'}
              </b>
            </Button>
          </span>
          <Button
            className="close-button"
            onClick={(): void => {
              setShow(false);
            }}
          >
            <FontAwesomeIcon fixedWidth icon={faX} size="lg" />
          </Button>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
