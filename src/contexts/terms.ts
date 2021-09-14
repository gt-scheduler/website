import React from 'react';

export type TermsContextValue = readonly string[];
export const TermsContext = React.createContext<TermsContextValue>([]);
