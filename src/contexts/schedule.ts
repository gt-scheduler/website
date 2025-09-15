import React from 'react';
import { Draft, Immutable } from 'immer';

import { Oscar } from '../data/beans';
import { EMPTY_OSCAR } from '../data/beans/Oscar';
import {
  defaultSchedule,
  FriendShareData,
  Schedule,
  TermScheduleData,
} from '../data/types';
import { ErrorWithFields } from '../log';
import { COURSES } from '../constants';

type ExtraData = {
  term: string;
  currentVersion: string;
  currentFriends: Record<string, FriendShareData>;
  allFriends: Record<string, Record<string, FriendShareData>>;
  allVersionNames: { id: string; name: string }[];
  courseContainerTab: number;
  // `oscar` is included below as a separate type
};

export type ScheduleContextData = Immutable<Schedule> &
  // `Oscar` can't go into `Immutable`, so we place it separately
  Immutable<ExtraData> & {
    readonly oscar: Oscar;
  } & Immutable<TermScheduleData>;

export type ScheduleContextSetters = {
  setTerm: (next: string) => void;
  patchSchedule: (patch: Partial<Schedule>) => void;
  updateSchedule: (
    applyDraft: (draft: Draft<Schedule>) => void | Immutable<Schedule>
  ) => void;
  setCurrentVersion: (next: string) => void;
  addNewVersion: (name: string, select?: boolean) => string;
  deleteVersion: (id: string) => void;
  renameVersion: (id: string, newName: string) => void;
  cloneVersion: (id: string, newName: string) => void;
  deleteFriendRecord: (versionId: string, friendId: string) => void;
  setCourseContainerTab: (tab: number) => void;
};
export type ScheduleContextValue = [
  ScheduleContextData,
  ScheduleContextSetters
];
export const ScheduleContext = React.createContext<ScheduleContextValue>([
  {
    term: '',
    currentVersion: '',
    currentFriends: {},
    courseContainerTab: COURSES,
    allVersionNames: [],
    allFriends: {},
    oscar: EMPTY_OSCAR,
    ...defaultSchedule,
    versions: {},
  },
  {
    setTerm: (next: string): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.setTerm value being used',
        fields: {
          next,
        },
      });
    },
    patchSchedule: (patch: Partial<Schedule>): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.patchSchedule value being used',
        fields: {
          patch,
        },
      });
    },
    updateSchedule: (): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.updateSchedule value being used',
      });
    },
    setCurrentVersion: (next: string): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.setCurrentVersion value being used',
        fields: {
          next,
        },
      });
    },
    deleteFriendRecord: (versionId: string, friendId: string): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.deleteFriendRecord value being used',
        fields: {
          versionId,
          friendId,
        },
      });
    },
    addNewVersion: (name: string, select?: boolean): string => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.addNewVersion value being used',
        fields: {
          name,
          select,
        },
      });
    },
    deleteVersion: (id: string): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.deleteVersion value being used',
        fields: {
          id,
        },
      });
    },
    renameVersion: (id: string, newName: string): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.renameVersion value being used',
        fields: {
          id,
          newName,
        },
      });
    },
    cloneVersion: (id: string, newName: string): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.cloneVersion value being used',
        fields: {
          id,
          newName,
        },
      });
    },
    setCourseContainerTab: (tab: number): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.setCourseContainerTab value being used',
        fields: { tab },
      });
    },
  },
]);
