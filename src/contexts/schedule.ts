import React from 'react';
import { Draft, Immutable } from 'immer';

import { Oscar } from '../data/beans';
import { EMPTY_OSCAR } from '../data/beans/Oscar';
import { defaultSchedule, Schedule } from '../data/types';
import { ErrorWithFields } from '../log';

type ExtraData = {
  term: string;
  currentVersion: string;
  allVersionNames: { id: string; name: string }[];
  // `oscar` is included below as a separate type
};

export type ScheduleContextData = Immutable<Schedule> &
  // `Oscar` can't go into `Immutable`, so we place it separately
  Immutable<ExtraData> & { readonly oscar: Oscar };

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
};
export type ScheduleContextValue = [
  ScheduleContextData,
  ScheduleContextSetters
];
export const ScheduleContext = React.createContext<ScheduleContextValue>([
  {
    term: '',
    currentVersion: '',
    allVersionNames: [],
    oscar: EMPTY_OSCAR,
    ...defaultSchedule,
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
  },
]);
