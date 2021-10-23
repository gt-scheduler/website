import React, { useEffect } from 'react';
import firebaseui from 'firebaseui';
import FirebaseAuth from 'react-firebaseui/FirebaseAuth';

import Modal from '../Modal';
import { firebase, authProviders } from '../../data/firebase';

import './stylesheet.scss';

const uiConfig: firebaseui.auth.Config = {
  // Popup sign-in flow rather than redirect flow.
  signInFlow: 'popup',
  signInOptions: authProviders,
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false,
  },
};

/**
 * Inner content of the login modal.
 * This utilizes Firebase UI to handle the authentication UI components.
 */
export function LoginModalContent(): React.ReactElement {
  return (
    <div className="login-modal-content">
      <h1>Sign in</h1>
      <p style={{ textAlign: 'center', marginBottom: 28 }}>
        Sign in using one of the below identity providers to start syncing your
        schedules across devices.
      </p>
      <FirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </div>
  );
}

export type LoginModalProps = {
  show: boolean;
  onHide: () => void;
};

/**
 * Component that can be used to show the login modal.
 * This utilizes Firebase UI to handle the authentication UI components.
 */
export default function LoginModal({
  show,
  onHide,
}: LoginModalProps): React.ReactElement {
  // If the modal is open,
  // attach a listener for the authentication state
  // to close it once the user logs in.
  useEffect(() => {
    if (show) {
      const removeListener = firebase.auth().onAuthStateChanged((user) => {
        if (user !== null) {
          onHide();
        }
      });
      return removeListener;
    }

    return undefined;
  }, [show, onHide]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      buttons={[
        { label: 'Cancel', onClick: (): void => onHide(), cancel: true },
      ]}
    >
      <LoginModalContent />
    </Modal>
  );
}
