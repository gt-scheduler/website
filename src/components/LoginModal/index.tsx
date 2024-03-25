import React, { useEffect } from 'react';
import firebaseui from 'firebaseui';
import FirebaseAuth from 'react-firebaseui/FirebaseAuth';

import { classes } from '../../utils/misc';
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

export type LoginModalContentProps = { comparison: boolean };

/**
 * Inner content of the login modal.
 * This utilizes Firebase UI to handle the authentication UI components.
 */
export function LoginModalContent({
  comparison,
}: LoginModalContentProps): React.ReactElement {
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
      {comparison ? (
        <p className="compare-text">
          You must <span className="underline">sign in</span> to use the Compare
          Schedule Feature!
        </p>
      ) : (
        <h1>Sign in</h1>
      )}
      <div className={classes(comparison && 'compare-subtext')}>
        <p className="login-modal-content__body">
          Sign in using one of the below identity providers to start syncing
          your schedules across devices.
        </p>
      </div>
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
  comparison?: boolean;
};

/**
 * Component that can be used to show the login modal.
 * This utilizes Firebase UI to handle the authentication UI components.
 */
export default function LoginModal({
  show,
  onHide,
  comparison = false,
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
      <LoginModalContent comparison={comparison} />
    </Modal>
  );
}
