import React, { useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import Modal from '../Modal';

// Key to mark when a user has already been shown the information modal.
// Update this when updating the contents of the modal.
const MODAL_LOCAL_STORAGE_KEY = '2023-03-05-spr2023-oscar-migration';

/**
 * Inner content of the information modal.
 * Change this to update the announcement that is shown when visiting the site.
 * Additionally, make sure to change `MODAL_LOCAL_STORAGE_KEY`
 * with another unique value that has never been used before.
 */
export function MigrationModalContent(): React.ReactElement {
  return (
    <>
      <img
        style={{ width: '175px', margin: '0 auto', display: 'block' }}
        alt="GT Scheduler Logo"
        src="/mascot.png"
      />
      <h1 style={{ lineHeight: 1, fontWeight: '700' }}>
        Scheduled Maintenance March 15 - March 16
      </h1>
      <h4 style={{ opacity: 0.7, fontWeight: '500' }}>March 5, 2023</h4>
      <p style={{ width: '500px', margin: '8px auto', textAlign: 'center' }}>
        The Registrar’s Office announced that the old version of the
        self-service registration system on OSCAR will sunset on March 16, 2023.
        In response to this change,
        <span style={{ color: '#C56E5B' }}>
          GT Scheduler will be undergoing maintenance, from March 15 12:00 AM ET
          to March 16 11:59 PM ET
        </span>
        , to ensure our services are compatible with the new registration option
        of BuzzPort - OSCAR. During this period, all services on
        gt-scheduler.org will be unavailable.
      </p>
      <p style={{ width: '500px', margin: '8px auto', textAlign: 'center' }}>
        We appreciate your continued support for GT Scheduler. For any
        inquiries, please{' '}
        <a href="mailto: contact@gt-scheduler.org">contact us</a>.
      </p>
    </>
  );
}

/**
 * Component that shows the information modal
 * upon the user's first visit to the site
 * when they haven't seen this version of the information modal before.
 */
export default function MigrationModal(): React.ReactElement {
  const [show, setShow] = useState(false);
  const [hasSeen, setHasSeen] = useLocalStorageState(MODAL_LOCAL_STORAGE_KEY, {
    defaultValue: false,
    storageSync: true,
  });
  const [checkbox, setCheckbox] = useState(false);

  useEffect(() => {
    if (!hasSeen) {
      setShow(true);
    }
  }, [hasSeen, setShow]);

  return (
    <Modal
      className="migration"
      show={show}
      onHide={(): void => setShow(false)}
      buttons={[
        {
          label: 'Got it!',
          onClick: (): void => {
            setShow(false);
            setHasSeen(checkbox);
          },
        },
      ]}
      width={800}
      checkbox={checkbox}
      setCheckbox={setCheckbox}
      checkboxContent="Don't show this mesage again"
    >
      <MigrationModalContent />
    </Modal>
  );
}
