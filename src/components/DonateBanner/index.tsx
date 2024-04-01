import React from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '../Button';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

const BANNER_LOCAL_STORAGE_KEY = '2024-04-01-spr2024-donate-banner';

export default function DonateBanner(): React.ReactElement {
  const [hasSeen, setHasSeen] = useLocalStorageState(BANNER_LOCAL_STORAGE_KEY, {
    defaultValue: false,
    storageSync: true,
  });
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  return (
    <div>
      {!hasSeen ? (
        <div className="banner">
          <div className="spacer" />
          <span>
            {!mobile
              ? 'Help keep GT Scheduler and its amazing features running!'
              : 'Help us and'}
            <a
              className="donateButton"
              href="https://donorbox.org/gt-scheduler"
            >
              <b className="buttonText">
                {!mobile ? 'Donate today.' : 'donate today.'}
              </b>
            </a>
          </span>
          <Button
            className="close-button"
            onClick={(): void => {
              setHasSeen(true);
            }}
          >
            <FontAwesomeIcon fixedWidth icon={faXmark} size="lg" />
          </Button>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
