import React from 'react';

export type TermsContextValue = string[];
export const TermsContext = React.createContext<TermsContextValue>([]);
