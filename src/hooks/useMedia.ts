import { useLayoutEffect, useState } from 'react';

/**
 * Gets whether the given CSS media query is matched or not.
 * Runs a layout effect to synchronously update the media match state
 *
 * Adapted from https://www.netlify.com/blog/2020/12/05/building-a-custom-react-media-query-hook-for-more-responsive-apps/
 * @param query A CSS media query
 * @returns Whether the CSS media query is matched
 */
export default function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (): void => setMatches(media.matches);
    media.addEventListener('change', listener);
    return (): void => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
