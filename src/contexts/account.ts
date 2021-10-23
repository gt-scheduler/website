import React from 'react';

export type SignedOut = {
  signedIn: false;
};

export type SignedIn = {
  signedIn: true;
  displayName: string;
  signOut: () => void;
};

export type AccountContextValue = SignedOut | SignedIn;
export const AccountContext = React.createContext<AccountContextValue>({
  signedIn: false,
});
