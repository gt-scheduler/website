import { useState, useEffect } from 'react';

import { isMobile } from '../utils';

/**
 * Subscribes to resize events on the page
 *
 * ? Would this be better to subscribe to a media query ?
 */
export default function useMobile(): boolean {
  const [mobile, setMobile] = useState(isMobile());
  useEffect(() => {
    const handleResize = (): void => {
      const newMobile = isMobile();
      if (mobile !== newMobile) {
        setMobile(newMobile);
      }
    };

    window.addEventListener('resize', handleResize);
    return (): void => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mobile]);

  return mobile;
}
