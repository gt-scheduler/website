import React from 'react';

import { Oscar } from '../data/beans';
import { EMPTY_OSCAR } from '../data/beans/Oscar';
import { ErrorWithFields } from '../log';
import { TermData, defaultTermData } from '../types';

export type ScheduleContextData = {
  term: string;
  oscar: Oscar;
} & TermData;
export type ScheduleContextSetters = {
  setTerm: (next: string) => void;
  patchSchedule: (patch: Partial<TermData>) => void;
};
export type ScheduleContextValue = [
  ScheduleContextData,
  ScheduleContextSetters
];
export const ScheduleContext = React.createContext<ScheduleContextValue>([
  {
    term: '',
    oscar: EMPTY_OSCAR,
    ...defaultTermData,
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
    patchSchedule: (patch: Partial<TermData>): void => {
      throw new ErrorWithFields({
        message: 'empty ScheduleContext.patchSchedule value being used',
        fields: {
          patch,
        },
      });
    },
  },
]);
