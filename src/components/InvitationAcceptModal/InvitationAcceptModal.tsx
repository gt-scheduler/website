import Modal from '../Modal';
import React, { useState } from 'react';
import './stylesheet.scss';

export default function InvitationAcceptModal(): React.ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(true);

  return (
    <Modal
      show={modalOpen}
      onHide={(): void => {
        setModalOpen(!modalOpen);
      }}
    >
      <div className="invitation-accept-modal-content">
        <h2 className="heading">
          You have successfully added a new schedule to your view!
        </h2>
      </div>
    </Modal>
  );
}
