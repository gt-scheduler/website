import { useLayoutEffect, useState } from 'react';

/**
 * Gets whether the given CSS media query is matched or not.
 * Runs a layout effect to synchronously update the media match state
 *
 * Adapted from https://www.netlify.com/blog/2020/12/05/building-a-custom-react-media-query-hook-for-more-responsive-apps/
 * @param query A CSS media query
 * @returns Whether the CSS media query is matched
 */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Gets whether the screen is currently larger than the specified width.
 * Runs internally as a layout effect.
 * @param width The target screen width, as a number (pixels)
 * or as a CSS unit expression
 * @returns Whether the screen is larger than the width
 */
export default function useScreenWidth(width: number | number): boolean {
  const widthWithUnits = typeof width === 'number' ? `${width}px` : width;
  return useMedia(`(min-width: ${widthWithUnits})`);
}
