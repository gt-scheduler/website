import React from 'react';
import useSWR from 'swr';

import { getContentClassName, getLabelClassName } from '../../utils/misc';
import { Section as SectionBean } from '../../data/beans';

import './stylesheet.scss';

// Seating information
export type OccupiedInfo = {
  occupied: number;
  total: number;
};

export type SeatInfoProps = {
  section: SectionBean;
  term: string;
  color: string | undefined;
};

// Response from fetchSeating
type SeatData = {
  inClass: OccupiedInfo | null;
  waitlist: OccupiedInfo | null;
};

// Fetch and normalize seating data for a section/term
const fetchSeating = async (
  section: SectionBean,
  term: string
): Promise<SeatData> => {
  try {
    const raw = await section.fetchSeating(term);

    // Handle missing or bad data, assuming less than 4 return values is invalid
    if (!raw[0] || raw[0].length < 4) {
      return { inClass: null, waitlist: null };
    }

    const [inClassTotal, inClassOccupied, waitlistTotal, waitlistOccupied] =
      raw[0];

    // normalize raw values into an OccupiedInfo object
    const toOccupiedInfo = (
      total: unknown,
      occupied: unknown
    ): OccupiedInfo => ({
      occupied: Number(occupied ?? 0),
      total: Number(total ?? 0),
    });

    return {
      inClass: toOccupiedInfo(inClassTotal, inClassOccupied),
      waitlist: toOccupiedInfo(waitlistTotal, waitlistOccupied),
    };
  } catch (err) {
    return { inClass: null, waitlist: null };
  }
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
    () => fetchSeating(section, term)
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
