import { Immutable } from 'immer';
import React from 'react';

import { defaultFriendData, FriendData } from '../data/types';

export type FriendContextData = Immutable<FriendData>;
// export type FriendContextSetters = {
// };

export type FriendContextValue = [
  FriendContextData
  // FriendContextSetters
];

export const FriendContext = React.createContext<FriendContextValue>([
  {
    ...defaultFriendData,
  },
]);
