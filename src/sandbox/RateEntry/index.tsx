import React from 'react';
import RateCard from '../../components/RateCard';

export default function RateEntryPage(): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center', // horizontal centering
        alignItems: 'center', // vertical centering
        height: '100vh', // fill viewport height
      }}
    >
      <RateCard
        courseOptions={[
          { id: 'CS1331', label: 'CS 1331' },
          { id: 'CS2340', label: 'CS 2340' },
        ]}
        sectionOptions={[
          { id: 'A1', label: 'A1' },
          { id: 'A2', label: 'A2' },
        ]}
        professorOptions={[
          { id: 'Jane Doe', label: 'Jane Doe' },
          { id: 'John Smith', label: 'John Smith' },
        ]}
      />
    </div>
  );
}
