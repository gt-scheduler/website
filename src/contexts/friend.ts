import { Immutable, Draft } from 'immer';
import React from 'react';

import {
  defaultFriendScheduleData,
  FriendInfo,
  FriendScheduleData,
  FriendTermData,
} from '../data/types';
import { ErrorWithFields } from '../log';
import defaultUIState, {
  CompareState,
} from '../data/hooks/useUIStateFromStorage';

export type FriendContextData = {
  friends: FriendScheduleData;
  compare: CompareState;
};
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
  setCompare: (next: boolean) => void;
  setPinned: (next: string[]) => void;
  setPinSelf: (next: boolean) => void;
};

export type FriendContextValue = [FriendContextData, FriendContextSetters];

export const FriendContext = React.createContext<FriendContextValue>([
  {
    friends: defaultFriendScheduleData,
    compare: defaultUIState().currentCompare,
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
    setCompare: (next: boolean): void => {
      throw new ErrorWithFields({
        message: 'empty FriendContext.compare value being used',
        fields: {
          next,
        },
      });
    },
    setPinned: (next: string[]): void => {
      throw new ErrorWithFields({
        message: 'empty FriendContext.compare value being used',
        fields: {
          next,
        },
      });
    },
    setPinSelf: (next: boolean): void => {
      throw new ErrorWithFields({
        message: 'empty FriendContext.compare value being used',
        fields: {
          next,
        },
      });
    },
  },
]);
