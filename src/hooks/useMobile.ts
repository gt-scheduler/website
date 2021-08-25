import { useState, useEffect } from 'react';
import { isMobile } from '../utils';

/**
 * Subscribes to resize events on the page
 *
 * ? Would this be better to subscribe to a media query ?
 */
export default function useMobile() {
  const [mobile, setMobile] = useState(isMobile());
  useEffect(() => {
    const handleResize = () => {
      const newMobile = isMobile();
      if (mobile !== newMobile) {
        setMobile(newMobile);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mobile]);

  return mobile;
}
