import React from 'react';
import { Draft, Immutable } from 'immer';

import { Oscar } from '../data/beans';
import { EMPTY_OSCAR } from '../data/beans/Oscar';
import { defaultSchedule, Schedule } from '../data/types';
import { ErrorWithFields } from '../log';

export type ScheduleContextData = Immutable<Schedule> & {
  readonly term: string;
  readonly oscar: Oscar;
};

export type ScheduleContextSetters = {
  setTerm: (next: string) => void;
  patchSchedule: (patch: Partial<Schedule>) => void;
  updateSchedule: (
    applyDraft: (draft: Draft<Schedule>) => void | Immutable<Schedule>
  ) => void;
};
export type ScheduleContextValue = [
  ScheduleContextData,
  ScheduleContextSetters
];
export const ScheduleContext = React.createContext<ScheduleContextValue>([
  {
    term: '',
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
  },
]);
