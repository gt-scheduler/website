import { Immutable, Draft } from 'immer';
import React from 'react';

import {
  defaultFriendScheduleData,
  FriendInfo,
  FriendScheduleData,
  FriendTermData,
} from '../data/types';
import { ErrorWithFields } from '../log';

export type FriendContextData = Immutable<{ friends: FriendScheduleData }>;
export type FriendContextSetters = {
  updateFriendTermData: (
    applyDraft: (
      draft: Draft<FriendTermData>
    ) => void | Immutable<FriendTermData>
  ) => void;
  updateFriendInfo: (
    applyDraft: (draft: Draft<FriendInfo>) => void | Immutable<FriendInfo>
  ) => void;
  renameFriend: (id: string, newName: string) => void;
};

export type FriendContextValue = [FriendContextData, FriendContextSetters];

export const FriendContext = React.createContext<FriendContextValue>([
  {
    friends: defaultFriendScheduleData,
  },
  {
    updateFriendTermData: (): void => {
      throw new ErrorWithFields({
        message: 'empty FriendContext.updateFriendTermData value being used',
      });
    },
    updateFriendInfo: (): void => {
      throw new ErrorWithFields({
        message: 'empty FriendContext.updateFriendInfo value being used',
      });
    },
    renameFriend: (id: string, newName: string): void => {
      throw new ErrorWithFields({
        message: 'empty FriendContext.renameFriend value being used',
        fields: {
          id,
          newName,
        },
      });
    },
  },
]);
