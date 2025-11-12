import React from 'react';
import useSWR from 'swr';

import { getContentClassName, getLabelClassName } from '../../utils/misc';
import { Section as SectionBean } from '../../data/beans';
import { OccupiedInfo, SeatData } from '../../data/beans/Section';

import './stylesheet.scss';

export type SeatInfoProps = {
  section: SectionBean;
  term: string;
  color: string | undefined;
};

// subcomponent for a single stat line (label + numbers)
function SeatingStat({
  label,
  info,
  isLoading,
  textClass,
  labelClass,
}: {
  label: string;
  info: OccupiedInfo | null;
  isLoading: boolean;
  textClass: string;
  labelClass: string;
}): React.ReactElement {
  return (
    <span className={`seating-label ${labelClass}`}>
      {label}{' '}
      <span className={`seat-waitlist-stats ${textClass}`}>
        {isLoading
          ? 'Loading...'
          : info
          ? `${info.occupied}/${info.total}`
          : 'N/A'}
      </span>
    </span>
  );
}

export default function SeatInfo({
  section,
  term,
  color,
}: SeatInfoProps): React.ReactElement {
  const { data: seatData, isLoading } = useSWR<SeatData>(
    ['seating', section.crn, term],
    () => section.getSeatData(term)
  );

  // Derive styling classes based on Section's color (passed down from Section)
  const textClass = getContentClassName(color);
  const labelClass = getLabelClassName(color);

  return (
    <div className="SeatInfo">
      <div className="seating-container">
        <div className="seating">
          <SeatingStat
            label="Seats Filled"
            info={seatData?.inClass ?? null}
            isLoading={isLoading}
            textClass={textClass}
            labelClass={labelClass}
          />
          <SeatingStat
            label="Waitlist Filled"
            info={seatData?.waitlist ?? null}
            isLoading={isLoading}
            textClass={textClass}
            labelClass={labelClass}
          />
        </div>
      </div>
    </div>
  );
}
