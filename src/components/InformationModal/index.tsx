import React, { useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { classes } from '../../utils/misc';
import { DESKTOP_BREAKPOINT, DONATE_LINK } from '../../constants';
import Modal from '../Modal';
import useScreenWidth from '../../hooks/useScreenWidth';
import Button from '../Button';

import './stylesheet.scss';

// Key to mark when a user has already been shown the information modal.
// Update this when updating the contents of the modal.
const MODAL_LOCAL_STORAGE_KEY = '2024-04-01-spr2024-new-features-announcement';
const OUTDATED_LOCAL_STORAGE_KEY = [
  '2023-04-05-spr2023-new-features-announcement',
  '2021-10-27-spr2022-schedule-versions-account-sync',
  '2023-03-05-spr2023-oscar-migration',
];

/**
 * Inner content of the information modal.
 * Change this to update the announcement that is shown when visiting the site.
 * Additionally, make sure to change `MODAL_LOCAL_STORAGE_KEY`
 * with another unique value that has never been used before.
 */

export type InformationModalContentProps = {
  setShow: (show: boolean) => void;
};

export function InformationModalContent({
  setShow,
}: InformationModalContentProps): React.ReactElement {
  return (
    <>
      <Button className="close-button" onClick={(): void => setShow(false)}>
        <FontAwesomeIcon icon={faXmark} size="xl" />
      </Button>
      <img
        style={{
          width: '150px',
          margin: '12px auto 16px auto',
          display: 'block',
        }}
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
        New Feature: Compare Schedules
      </h1>
      <h4 style={{ opacity: 0.7, fontWeight: 700 }}>April 2, 2024</h4>
      <div className="information-content">
        <p>
          Hello <span style={{ color: '#EDA91F' }}>Yellow Jackets!</span> We are
          excited to announce a new feature for GT Scheduler.
          <br />
          <br />
          Share your schedule with other students and they can share theirs
          back. Then toggle &quot;Compare Schedules&quot; and click on the other
          students&apos; schedules to compare.
          <br />
          <br />
          However, to keep GT Scheduler and its amazing features, we need to
          maintain our costs. Please consider donating to help keep GT Scheduler
          running!
        </p>
        <div className="information-images">
          <img
            className="information-image"
            alt="Compare Schedules View"
            src="/compare_schedule.png"
          />
          <div className="information-spacer" />
          <img
            className="information-image"
            alt="Compare Schedules Panel"
            src="/compare_panel.png"
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
      buttons={[
        {
          label: 'Donate Today',
          onClick: (): void => {
            setShow(false);
            window.open(DONATE_LINK);
          },
        },
      ]}
      width={850}
    >
      <InformationModalContent setShow={setShow} />
    </Modal>
  );
}
