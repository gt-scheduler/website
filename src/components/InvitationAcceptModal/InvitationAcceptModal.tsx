import Modal from '../Modal';
import Button from '../Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import React, { useState } from 'react';

import './stylesheet.scss';

export default function InvitationAcceptModal(): React.ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(true);

  const onHide = (): void => {
    setModalOpen(!modalOpen);
  };

  return (
    <Modal show={modalOpen} onHide={onHide} width={700}>
      <Button className="remove-close-button" onClick={onHide}>
        <FontAwesomeIcon icon={faXmark} size="xl" />
      </Button>
      <div className="invitation-accept-modal-content">
        <div className="heading">
          You have successfully added a new schedule to your view!
        </div>
        <div className="sub-heading">
          You will now be able to see winniezhang@gmail.com‘s schedule!
        </div>
        <img src="/scheduled.png" alt="ok" className="modal-image" />
        <div className="modal-bottom">
          <div>Would you like to share your schedule back?</div>
          <div className="button-row">
            <button type="submit" className="no-button">
              No
            </button>
            <button type="submit" className="share-button">
              Share Back
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
