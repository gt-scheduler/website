import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import swal from '@sweetalert/with-react';

import { softError, ErrorWithFields } from '../../log';

// Key to mark when a user has already been shown the information modal.
// Update this when updating the contents of the modal.
// In the future, prefix all keys with `YYYY-MM-DD-`
// to ensure that they remain globally unique.
const MODAL_COOKIE_KEY = 'visited-merge-notice';

/**
 * Inner content of the information modal.
 * Change this to update the announcement that is shown when visiting the site.
 * Additionally, make sure to change `MODAL_COOKIE_KEY` with another unique
 * value that has never been used before.
 */
export function InformationModalContent(): React.ReactElement {
  return (
    <div>
      <img
        style={{ width: '175px', margin: '0 auto', display: 'block' }}
        alt="GT Scheduler Logo"
        src="/mascot.png"
      />
      <h1>GT Scheduler</h1>
      <p>
        Hey there, yellow jackets!{' '}
        <a href="https://github.com/gt-scheduler">GT Scheduler</a> is a new
        collaboration between <a href="https://bitsofgood.org/">Bits of Good</a>{' '}
        and <a href="https://jasonpark.me/">Jason (Jinseo) Park</a> aimed at
        making class registration easier for everybody! Now, you can access
        course prerequisites, instructor GPAs, live seating information, and
        more all in one location.
      </p>
      <p>
        If you enjoy our work and are interested in contributing, feel free to{' '}
        <a href="https://github.com/gt-scheduler/website/pulls">
          open a pull request
        </a>{' '}
        with your improvements. Thank you and enjoy!
      </p>
    </div>
  );
}

/**
 * Hook to show the information modal upon the user's first visit to the site
 * when they haven't seen this version of the information modal before.
 */
export function useInformationModal(): void {
  useEffect(() => {
    if (!Cookies.get(MODAL_COOKIE_KEY)) {
      swal({
        button: 'Got It!',
        content: <InformationModalContent />,
      }).catch((err) => {
        softError(
          new ErrorWithFields({
            message: 'error with swal call',
            source: err,
            fields: {
              cookieKey: MODAL_COOKIE_KEY,
            },
          })
        );
      });

      Cookies.set(MODAL_COOKIE_KEY, 'true', { expires: 365 });
    }
  }, []);
}
