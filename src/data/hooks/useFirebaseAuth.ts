import { useEffect, useState } from 'react';

import { AccountContextValue } from '../../contexts/account';
import { ErrorWithFields, softError } from '../../log';
import { LoadingState } from '../../types';
import { firebase, isAuthEnabled } from '../firebase';

export default function useFirebaseAuth(): LoadingState<AccountContextValue> {
  const [accountState, setAccountState] = useState<AccountContextValue | null>(
    null
  );

  // Listen to the Firebase Auth state and set the local state.
  useEffect(() => {
    if (!isAuthEnabled) return undefined;

    const unregisterAuthObserver = firebase
      .auth()
      .onAuthStateChanged((user) => {
        if (user === null) {
          setAccountState({ type: 'signedOut' });
        } else {
          let provider: string | null = null;
          if (user.providerData != null) {
            const firstProviderData = user.providerData[0];
            if (firstProviderData != null) {
              provider = firstProviderData.providerId;
            }
          }
          setAccountState({
            type: 'signedIn',
            name: user.displayName,
            email: user.email,
            id: user.uid,
            getToken: (): Promise<string> => {
              const { currentUser } = firebase.auth();
              if (!currentUser) {
                return Promise.reject(
                  new ErrorWithFields({
                    message: 'firebase.auth().currentUser is null',
                  })
                );
              }
              return currentUser.getIdToken();
            },
            provider,
            signOut: () => {
              firebase
                .auth()
                .signOut()
                .then(() => {
                  // don't want to share localStorage between accounts
                  localStorage.clear();
                })
                .catch((err) => {
                  softError(
                    new ErrorWithFields({
                      message: 'call to firebase.auth().signOut() failed',
                      source: err,
                    })
                  );
                });
            },
          });
        }
      });
    return (): void => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
  }, []);

  if (!isAuthEnabled) {
    return {
      type: 'loaded',
      result: {
        type: 'signedOut',
      },
    };
  }

  if (accountState === null) {
    return { type: 'loading' };
  }

  return { type: 'loaded', result: accountState };
}
