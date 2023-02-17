import React, { useEffect, useState } from 'react';
import firebaseui from 'firebaseui';
import FirebaseAuth from 'react-firebaseui/FirebaseAuth';
import {
  faCaretDown,
  faCircle,
  faCircleXmark,
  faClose,
  faTriangleCircleSquare,
  faTriangleExclamation,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Modal from '../Modal';
import { firebase, authProviders } from '../../data/firebase';

import './stylesheet.scss';

import Button from '../Button';

import { Props } from 'react-firebaseui';

/**
 * Inner content of the login modal.
 */
export function InvitationModalContent(): React.ReactElement {
  // Array for testing style of shared emails
  const [emails, setEmails] = useState([
    ['user1@example.com', 'Pending'],
    ['user2@example.com', 'Accepted'],
    ['ReallyLongNameThatWillNotFitInRowAbove@example.com', 'Accepted'],
    ['goodEmail@gmail.com', 'Accepted'],
    ['user1@example.com', 'Pending'],
    ['user2@example.com', 'Accepted'],
    ['ReallyLongNameThatWillNotFitInRowAbove@example.com', 'Accepted'],
    ['goodEmail@gmail.com', 'Accepted'],
  ]);

  // Array to test invalid email
  const validUsers = ['user1@example.com', 'user2@example.com'];
  const [input, setInput] = useState('');
  let valid = false;
  const [validMessage, setValidMessage] = useState('');
  const [validClassName, setValidClassName] = useState('');

  function verifyUser(): void {
    validUsers.forEach((element) => {
      if (element === input) {
        valid = true;
        setValidMessage('Successfully sent!');
        setValidClassName('valid-email');
        setInput('');
      }
      if (!valid) {
        valid = false;
        setValidMessage('Invalid Email');
        setValidClassName('invalid-email');
      }
    });
  }

  return (
    <div className="invitation-modal-content">
      <h2>Share Schedule</h2>
      <p>
        Enter the email associated with another user&apos;s GT-Scheduler account
        & we&apos;ll them an invite via email to import this schedule into their
        view
      </p>
      <div className="email-block">
        {/* <form>
                    <text className='invalid-email'>Invalid Email</text>
                    <input
                        type="email"
                        id="email"
                        className="email"
                        placeholder="recipient@example.com"
                    />
                </form> */}
        <div className="email-input">
          <input
            type="email"
            id="email"
            value={input}
            className="email"
            placeholder="recipient@example.com"
            list="recent-invites"
            onChange={(e): void => setInput(e.target.value)}
          />
          <datalist id="recent-invites">
            {emails.map((element) => (
              <option>{element[0]}</option>
            ))}
          </datalist>
          <text className={validClassName}>{validMessage}</text>
        </div>
        <button
          type="button"
          className="send-button"
          onClick={(e): void => {
            verifyUser();
          }}
        >
          Send Invite
        </button>
      </div>
      <hr className="divider" />
      <p>
        Users Invited to View <strong>Primary</strong>
      </p>
      <div className="shared-emails">
        {emails.map((element) => (
          <div className="email-and-status">
            <div className="individual-shared-email" id={element[1]}>
              {element[0]}
              <Button className="button-remove">
                <FontAwesomeIcon className="circle" icon={faCircle} />
                <FontAwesomeIcon className="remove" icon={faClose} />
              </Button>
            </div>
            <div className="status">
              <div className="status-text">
                <text>Status: {element[1]}</text>
              </div>
              <Button className="caret-down-button">
                <FontAwesomeIcon className="caret-down" icon={faCaretDown} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type LoginModalProps = {
  show: boolean;
  onHide: () => void;
};

/**
 * Component that can be used to show the invitaion modal.
 */
export default function InvitationModal({
  show,
  onHide,
}: LoginModalProps): React.ReactElement {
  return (
    <Modal
      show={show}
      className="invatation-modal"
      onHide={onHide}
      buttons={[
        { label: 'Cancel', onClick: (): void => onHide(), cancel: true },
      ]}
    >
      <InvitationModalContent />
    </Modal>
  );
}
