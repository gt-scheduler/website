import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import useLocalStorageState from 'use-local-storage-state';

import Modal from '../Modal';

// Key to mark when a user has already been shown the information modal.
// Update this when updating the contents of the modal.
const MODAL_LOCAL_STORAGE_KEY =
  '2021-10-27-spr2022-schedule-versions-account-sync';

/**
 * Inner content of the information modal.
 * Change this to update the announcement that is shown when visiting the site.
 * Additionally, make sure to change `MODAL_LOCAL_STORAGE_KEY`
 * with another unique value that has never been used before.
 */
export function InformationModalContent(): React.ReactElement {
  return (
    <>
      <img
        style={{ width: '175px', margin: '0 auto', display: 'block' }}
        alt="GT Scheduler Logo"
        src="/mascot.png"
      />
      <h1 style={{ lineHeight: 1 }}>
        Spring 2022 courses, schedule versions, and account sync
      </h1>
      <h4 style={{ opacity: 0.7 }}>October 27th, 2021</h4>
      <p>
        Hey there, yellow jackets! Today marks the release of the Spring 2022
        course catalog. You can access it in GT Scheduler by selecting{' '}
        <strong>&ldquo;Spring 2022&rdquo;</strong> from the term drop-down in
        the top-left.
      </p>
      <p>
        On behalf of the GT Scheduler contributors, we&apos;re also excited to
        announce two of the most-requested features:
      </p>
      <ul>
        <li style={{ marginBottom: 8 }}>
          <strong>Schedule versions</strong> - Now, next to the term drop-down
          in the top-left, there is also a schedule drop-down. Use it to{' '}
          <strong>create new schedules</strong> and{' '}
          <strong>switch between existing ones</strong>.
          <img
            style={{
              width: '100%',
              height: 'auto',
              margin: '8px auto',
              display: 'block',
            }}
            alt="GT Scheduler Logo"
            src="/schedule_versions.png"
          />
        </li>
        <li>
          <strong>Account sync</strong> - In addition to creating multiple
          schedules, you can now also{' '}
          <strong>sync these schedules between devices.</strong> Use the
          drop-down in the top right to sign in and upload your schedules to the
          cloud. Currently, the app supports either email/password, Google, or
          GitHub sign-in options:
          <img
            style={{
              width: '100%',
              height: 'auto',
              margin: '16px auto',
              display: 'block',
            }}
            alt="GT Scheduler Logo"
            src="/account_sync.png"
          />
          Note that signing in is completely optional: the app will still work
          without an account (your schedules will instead be stored locally on
          your device).
        </li>
      </ul>
      <p>
        If you find any bugs in these features or in existing ones, feel free to{' '}
        <a href="https://github.com/gt-scheduler/website/issues/new/choose">
          open an issue on the GT Scheduler GitHub
        </a>{' '}
        and we will try our best to fix them.
      </p>
      <p>
        A big thank you to everyone that{' '}
        <a href="https://github.com/gt-scheduler/website/graphs/contributors">
          contributed
        </a>{' '}
        to the project in the past year. GT Scheduler is an open source project,
        and we hope that we&apos;ve been able to make your scheduling experience
        better. If you enjoy our work and are interested in contributing, feel
        free to{' '}
        <a href="https://github.com/gt-scheduler/website/pulls">
          open a pull request
        </a>{' '}
        with your improvements. Thank you and enjoy!
      </p>
    </>
  );
}

/**
 * Component that shows the information modal
 * upon the user's first visit to the site
 * when they haven't seen this version of the information modal before.
 */
export default function InformationModal(): React.ReactElement {
  const [show, setShow] = useState(false);
  const [hasSeen, setHasSeen] = useLocalStorageState(
    MODAL_LOCAL_STORAGE_KEY,
    () => {
      const cookieValue = Cookies.get(MODAL_LOCAL_STORAGE_KEY);
      if (cookieValue === 'true') return true;
      return false;
    }
  );

  useEffect(() => {
    if (!hasSeen) {
      setShow(true);
      setHasSeen(true);
    }
  }, [hasSeen, setHasSeen]);

  return (
    <Modal
      show={show}
      onHide={(): void => setShow(false)}
      buttons={[{ label: 'Got it!', onClick: (): void => setShow(false) }]}
      width={800}
    >
      <InformationModalContent />
    </Modal>
  );
}
