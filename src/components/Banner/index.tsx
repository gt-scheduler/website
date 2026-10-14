import React from 'react';

import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

type BannerProps = {
  content: React.ReactElement;
  mobileContent?: React.ReactElement;
};

export default function Banner({
  content,
  mobileContent,
}: BannerProps): React.ReactElement {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  return (
    <div className="banner">
      <div className="bannerContent">
        {!mobile ? content : mobileContent || content}
      </div>
    </div>
  );
}
