import React from 'react';

import { ErrorWithFields } from '../log';

export type OverlayCrnsContextValue = [string[], (next: string[]) => void];
export const OverlayCrnsContext = React.createContext<OverlayCrnsContextValue>([
  [],
  (next: string[]): void => {
    throw new ErrorWithFields({
      message: 'empty OverlayCrnsContext.setOverlayCrns value being used',
      fields: {
        next,
      },
    });
  },
]);

export const a = 'ouleuouleuouleu';
