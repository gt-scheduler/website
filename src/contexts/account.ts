import React from 'react';

export type SignedOut = {
  type: 'signedOut';
};

export type SignedIn = {
  type: 'signedIn';
  signOut: () => void;
  getToken: () => Promise<string | void>;
  name: string | null;
  provider: string | null;
  email: string | null;
  id: string;
};

export type AccountContextValue = SignedOut | SignedIn;
export const AccountContext = React.createContext<AccountContextValue>({
  type: 'signedOut',
});
