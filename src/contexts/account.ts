import React from 'react';

export type SignedOut = {
  type: 'signedOut';
};

export type SignedIn = {
  type: 'signedIn';
  displayName: string;
  signOut: () => void;
};

export type AccountContextValue = SignedOut | SignedIn;
export const AccountContext = React.createContext<AccountContextValue>({
  type: 'signedOut',
});
