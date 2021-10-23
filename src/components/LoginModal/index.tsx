import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import swal from '@sweetalert/with-react';
import firebase from 'firebase';
import firebaseui from 'firebaseui';
import FirebaseAuth from 'react-firebaseui/FirebaseAuth';

import { softError, ErrorWithFields } from '../../log';

import './stylesheet.scss';

const uiConfig: firebaseui.auth.Config = {
  // Popup sign-in flow rather than redirect flow.
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
  ],
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false,
  },
};

export type LoginModalContentHandle = {
  onClose: () => void;
};

/**
 * Inner content of the login modal.
 * This utilizes Firebase UI to handle the authentication UI components.
 */
export const LoginModalContent = React.forwardRef<LoginModalContentHandle>(
  (_props, ref): React.ReactElement | null => {
    const firebaseAuthUI = useRef<null | FirebaseAuth>(null);
    useImperativeHandle(ref, () => {
      const handle: LoginModalContentHandle = {
        onClose: (): void => {
          // Manually invoke the `componentWillUnmount` method.
          // This is a pretty ugly workaround, but it works.
          const authUI = firebaseAuthUI.current;
          if (authUI === null) return;
          const callback = authUI.componentWillUnmount?.bind(authUI);
          if (callback != null) callback();
        },
      };
      return handle;
    });

    // Focus the invisible input upon first render
    // This is to remove focus from the cancel button on the modal.
    const invisibleInputRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
      setImmediate(() => {
        invisibleInputRef.current?.focus();
      });
    }, []);

    return (
      <div className="login-modal-content">
        <input
          className="invisible-input"
          aria-hidden="true"
          ref={invisibleInputRef}
          type="checkbox"
        />
        <h1>Sign in</h1>
        <p style={{ textAlign: 'center', marginBottom: 28 }}>
          Sign in using one of the below identity providers to start syncing
          your schedules across devices.
        </p>
        <FirebaseAuth
          ref={firebaseAuthUI}
          uiConfig={uiConfig}
          firebaseAuth={firebase.auth()}
        />
      </div>
    );
  }
);

/**
 * Hook to get a callback that can be used to show the login modal.
 * This utilizes Firebase UI to handle the authentication UI components.
 */
export function useLoginModal(): () => void {
  const contentRef = useRef<LoginModalContentHandle | null>(null);
  return useCallback(() => {
    swal({
      button: 'Cancel',
      content: <LoginModalContent ref={contentRef} />,
    })
      .catch((err) => {
        softError(
          new ErrorWithFields({
            message: 'error with swal call in useLoginModal',
            source: err,
          })
        );
      })
      .then(() => new Promise((r) => setTimeout(r, 100)))
      .then(() => {
        // Use the imperative handle to manually teardown the UI.
        // Swal doesn't do this unfortunately.
        contentRef.current?.onClose();
      })
      .catch(() => {
        /* ignore */
      });
  }, []);
}
