import React, { useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import Modal from '../Modal';

import './stylesheet.scss';

// Key to mark when a user has already been shown the information modal.
// Update this when updating the contents of the modal.
const MODAL_LOCAL_STORAGE_KEY = '2023-03-05-spr2023-oscar-migration';

/**
 * Inner content of the information modal.
 * Change this to update the announcement that is shown when visiting the site.
 * Additionally, make sure to change `MODAL_LOCAL_STORAGE_KEY`
 * with another unique value that has never been used before.
 */
export function MaintenanceModalContent(): React.ReactElement {
  return (
    <>
      <img alt="GT Scheduler Logo" src="/mascot.png" />
      <h2>Scheduled Maintenance March 15 - March 16</h2>
      <h4>March 5, 2023</h4>
      <p className="maintenance-content">
        The Registrar’s Office announced that the old version of the
        self-service registration system on OSCAR will sunset on March 16, 2023.
        <br />
        In response to this change,&nbsp;
        <span style={{ color: '#C56E5B' }}>
          GT Scheduler will be undergoing maintenance, from March 15 12:00 AM ET
          to March 16 11:59 PM ET
        </span>
        , to ensure our services are compatible with the new registration option
        of BuzzPort - OSCAR. During this period, all services on
        gt-scheduler.org will be unavailable.
      </p>
      <p className="migration-content">
        We appreciate your continued support for GT Scheduler. <br />
        For any inquiries, please&nbsp;
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
export default function MaintenanceModal(): React.ReactElement {
  const date = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  );

  // modal should only be shown before Mar 15, 2023 0:00 AM ET
  const isValid =
    date.getFullYear() === 2023 &&
    date.getMonth() + 1 <= 3 &&
    date.getDate() < 15;

  const [show, setShow] = useState(false);
  const [hasSeen, setHasSeen] = useLocalStorageState(MODAL_LOCAL_STORAGE_KEY, {
    defaultValue: !isValid,
    storageSync: true,
  });

  // override storage key
  useEffect(() => {
    if (!isValid) setHasSeen(!isValid);
  }, [isValid, setHasSeen]);

  const [checkbox, setCheckbox] = useState(false);

  useEffect(() => {
    if (!hasSeen) {
      setShow(true);
    }
  }, [hasSeen, setShow]);

  return (
    <Modal
      className="MaintenanceModal"
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
      checkboxContent={`Don't show this again`}
    >
      <MaintenanceModalContent />
    </Modal>
  );
}
