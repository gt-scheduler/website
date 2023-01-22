import { useLayoutEffect, useState } from 'react';

import { ErrorWithFields, softError } from '../log';

/**
 * Gets whether the given CSS media query is matched or not.
 * Runs a layout effect to synchronously update the media match state
 *
 * Adapted from https://www.netlify.com/blog/2020/12/05/building-a-custom-react-media-query-hook-for-more-responsive-apps/
 * @param query A CSS media query
 * @returns Whether the CSS media query is matched
 */
export default function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    try {
      return window.matchMedia(query).matches;
    } catch (error) {
      softError(
        new ErrorWithFields({
          message: 'could not run useMedia query in useState init',
          source: error,
          fields: {
            query,
          },
        })
      );
      return false;
    }
  });

  useLayoutEffect(() => {
    try {
      const media = window.matchMedia(query);
      setMatches(media.matches);

      const listener = (): void => setMatches(media.matches);
      let apiUsed: 'addEventListener' | 'addListener' | null = null;
      if (media.addEventListener != null) {
        media.addEventListener('change', listener);
        apiUsed = 'addEventListener';
      } else if (media.addListener != null) {
        // In Safari <14, we have to use `addListener`:
        // https://caniuse.com/mdn-api_mediaquerylist_addlistener
        media.addListener(listener);
        apiUsed = 'addListener';
      } else {
        apiUsed = null;
      }

      return (): void => {
        try {
          // Use the corresponding cleanup API
          // based on the API used to attach the listener
          switch (apiUsed) {
            case 'addEventListener':
              media.removeEventListener('change', listener);
              break;
            case 'addListener':
              media.removeListener(listener);
              break;
            default:
              break;
          }
        } catch (err) {
          softError(
            new ErrorWithFields({
              message:
                'could not run useMedia query cleanup in layout effect cleanup',
              source: err,
              fields: {
                previousQuery: query,
              },
            })
          );
        }
      };
    } catch (err) {
      softError(
        new ErrorWithFields({
          message: 'could not run useMedia query in layout effect',
          source: err,
          fields: {
            query,
          },
        })
      );
      return (): void => undefined;
    }
  }, [query]);

  return matches;
}
