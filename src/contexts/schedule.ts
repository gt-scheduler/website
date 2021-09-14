import React from 'react';
import { Draft, Immutable } from 'immer';

import { Oscar } from '../data/beans';
import { EMPTY_OSCAR } from '../data/beans/Oscar';
import { defaultSchedule, Schedule } from '../data/types';
import { ErrorWithFields } from '../log';

type ExtraData = {
  term: string;
  currentVersionIndex: number;
  allVersionNames: string[];
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
  setCurrentVersion: (nextIndex: number) => void;
  addNewVersion: (name: string, select?: boolean) => void;
  deleteVersion: (index: number) => void;
  renameVersion: (index: number, newName: string) => void;
};
export type ScheduleContextValue = [
  ScheduleContextData,
  ScheduleContextSetters
];
export const ScheduleContext = React.createContext<ScheduleContextValue>([
  {
    term: '',
    currentVersionIndex: 0,
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
    setCurrentVersion: (nextIndex: number): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.setCurrentVersion value being used',
        fields: {
          nextIndex,
        },
      });
    },
    addNewVersion: (name: string, select?: boolean): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.addNewVersion value being used',
        fields: {
          name,
          select,
        },
      });
    },
    deleteVersion: (index: number): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.deleteVersion value being used',
        fields: {
          index,
        },
      });
    },
    renameVersion: (index: number, newName: string): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.renameVersion value being used',
        fields: {
          index,
          newName,
        },
      });
    },
  },
]);
