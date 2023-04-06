import React, { useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

import { classes } from '../../utils/misc';
import { DESKTOP_BREAKPOINT } from '../../constants';
import Modal from '../Modal';
import useScreenWidth from '../../hooks/useScreenWidth';

import './stylesheet.scss';

// Key to mark when a user has already been shown the information modal.
// Update this when updating the contents of the modal.
const MODAL_LOCAL_STORAGE_KEY = '2023-04-05-spr2023-new-features-announcement';
const OUTDATED_LOCAL_STORAGE_KEY = [
  '2021-10-27-spr2022-schedule-versions-account-sync',
  '2023-03-05-spr2023-oscar-migration',
];

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
        style={{ width: '150px', margin: '0 auto', display: 'block' }}
        alt="GT Scheduler Logo"
        src="/mascot.png"
      />
      <h1
        style={{
          lineHeight: 1,
          fontWeight: 700,
          fontSize: '28px',
          margin: '16px auto',
        }}
      >
        New Feature: Recurring Events
      </h1>
      <h4 style={{ opacity: 0.7, fontWeight: 700 }}>April 6, 2023</h4>
      <div className="information-content">
        <p>
          Hello <span style={{ color: '#EDA91F' }}>Yellow Jackets!</span> We are
          excited to announce a new feature for GT Scheduler.
          <br />
          <br />
          Use Recurring Events to block out meetings, work shifts, and any other
          weekly events you may need to schedule your classes around.
          <br />
          <br />
          Add, edit, and delete events in the Recurring Events tab, next to the
          Courses tab.
          <br />
          <br />
          Drag and drop (web-only) events on the schedule view to adjust times.
        </p>
        <div className="information-images">
          <img
            className="information-image"
            alt="Event Blocks"
            src="/event_blocks.png"
          />
          <div className="information-spacer" />
          <img
            className="information-image"
            alt="Drag Drop"
            src="/drag_event_blocks.png"
          />
        </div>
      </div>
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
  const [hasSeen, setHasSeen] = useLocalStorageState(MODAL_LOCAL_STORAGE_KEY, {
    defaultValue: false,
    storageSync: true,
  });
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  OUTDATED_LOCAL_STORAGE_KEY.forEach((key) =>
    window.localStorage.removeItem(key)
  );

  useEffect(() => {
    if (!hasSeen) {
      setShow(true);
      setHasSeen(true);
    }
  }, [hasSeen, setHasSeen]);

  return (
    <Modal
      className={classes('InformationModal', mobile && 'mobile')}
      show={show}
      onHide={(): void => setShow(false)}
      buttons={[{ label: 'Got it!', onClick: (): void => setShow(false) }]}
      width={800}
    >
      <InformationModalContent />
    </Modal>
  );
}
