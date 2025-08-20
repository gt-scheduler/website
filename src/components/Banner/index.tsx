import React from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Button from '../Button';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

type BannerProps = {
  localStorageKey: string;
  content: React.ReactElement;
  mobileContent?: React.ReactElement;
};

export default function Banner({
  localStorageKey,
  content,
  mobileContent,
}: BannerProps): React.ReactElement {
  const [hasSeen, setHasSeen] = useLocalStorageState(localStorageKey, {
    defaultValue: false,
    storageSync: true,
  });
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  if (hasSeen) return <div />;

  return (
    <div className="banner">
      <div className="spacer" />
      {!mobile ? content : mobileContent || content}
      <Button
        className="close-button"
        onClick={(): void => {
          setHasSeen(true);
        }}
      >
        <FontAwesomeIcon fixedWidth icon={faXmark} size="lg" />
      </Button>
    </div>
  );
}
