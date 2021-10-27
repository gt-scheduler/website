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
  // Calculate the min height of the FirebaseUI element
  // so that it does not cause a large layout shift when initially loading.
  // The height is determined based on the number of auth providers,
  // which directly determines the number of stacked vertical buttons.
  // Each button is 40px wide with a 15px gap.
  let minHeight = authProviders.length * 40;
  if (authProviders.length >= 2) {
    minHeight += (authProviders.length - 1) * 15;
  }

  return (
    <div className="login-modal-content">
      <h1>Sign in</h1>
      <p className="login-modal-content__body">
        Sign in using one of the below identity providers to start syncing your
        schedules across devices.
      </p>
      <div style={{ minHeight }}>
        <FirebaseAuth
          className="login-modal-content__firebase-ui"
          uiConfig={uiConfig}
          firebaseAuth={firebase.auth()}
        />
      </div>
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
