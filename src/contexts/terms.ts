import React from 'react';

import { Term } from '../types';

export type TermsContextValue = Term[];
export const TermsContext = React.createContext<TermsContextValue>([]);
