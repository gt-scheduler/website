import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useLocalStorageState from 'use-local-storage-state';

import Button from '../Button';
import Modal from '../Modal';
import InvitationModal from '../InvitationModal';

import './stylesheet.scss';

export type InvitationAcceptModalProps = {
  handleCompareSchedules: (
    compare?: boolean,
    pinnedSchedules?: string[],
    pinSelf?: boolean,
    expanded?: boolean
  ) => void;
};

export default function InvitationAcceptModal({
  handleCompareSchedules,
}: InvitationAcceptModalProps): React.ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [invitationModalOpen, setInvitationModalOpen] =
    useState<boolean>(false);
  const [searchParams] = useSearchParams();

  const [hasSeen, setHasSeen] = useLocalStorageState(
    `redirect-invitation-modal-${searchParams.get('inviteId') ?? ''}`,
    {
      defaultValue: false,
      storageSync: true,
    }
  );

  useEffect(() => {
    if (
      !searchParams.get('inviteId') ||
      !searchParams.get('status') ||
      !searchParams.get('email') ||
      hasSeen
    ) {
      setModalOpen(false);
    } else {
      setModalOpen(true);
    }
  }, [searchParams, hasSeen]);

  const onHide = (): void => {
    setHasSeen(true);
    setModalOpen(!modalOpen);
    handleCompareSchedules(true, undefined, undefined, true);
  };

  return (
    <>
      <InvitationModal
        show={invitationModalOpen}
        onHide={(): void => {
          setInvitationModalOpen(false);
        }}
        inputEmail={searchParams.get('email') ?? undefined}
      />
      <Modal show={modalOpen} onHide={onHide} width={700}>
        <Button className="remove-close-button" onClick={onHide}>
          <FontAwesomeIcon icon={faXmark} size="xl" />
        </Button>
        <div className="invitation-accept-modal-content">
          <div className="heading">
            {searchParams.get('status') === 'success'
              ? 'You have successfully added a new schedule to your view!'
              : 'Failed to add the schedule, please ask the user for a new invite.'}
          </div>
          {searchParams.get('status') === 'success' ? (
            <>
              <div className="sub-heading">
                You will now be able to see {searchParams.get('email')}&apos;s
                schedule!
              </div>

              <img src="/scheduled.png" alt="ok" className="modal-image" />
              <div className="modal-bottom">
                <div>Would you like to share your schedule back?</div>

                <div className="button-row">
                  <button type="submit" className="no-button" onClick={onHide}>
                    No
                  </button>
                  <button
                    type="submit"
                    className="share-button"
                    onClick={(): void => {
                      onHide();
                      setInvitationModalOpen(true);
                    }}
                  >
                    Share Back
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
