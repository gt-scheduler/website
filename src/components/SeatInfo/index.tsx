/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import useSWR from 'swr';

import { getContentClassName } from '../../utils/misc';
import { Section as SectionBean } from '../../data/beans';

import './stylesheet.scss';

export type OccupiedInfo = {
  occupied: number;
  total: number;
};

export type SeatInfoProps = {
  section: SectionBean;
  term: string;
  color: string | undefined;
};

type SeatData = {
  inClass: OccupiedInfo | null;
  waitlist: OccupiedInfo | null;
};

const fetchSeating = async (
  section: SectionBean,
  term: string
): Promise<SeatData> => {
  try {
    const raw = await section.fetchSeating(term);

    if (!raw[0] || raw[0].length < 4) {
      return { inClass: null, waitlist: null };
    }

    const [inClassTotal, inClassOccupied, waitlistTotal, waitlistOccupied] =
      raw[0];

    return {
      inClass: {
        occupied: Number(inClassOccupied ?? 0),
        total: Number(inClassTotal ?? 0),
      },
      waitlist: {
        occupied: Number(waitlistOccupied ?? 0),
        total: Number(waitlistTotal ?? 0),
      },
    };
  } catch (err) {
    return { inClass: null, waitlist: null };
  }
};

export default function SeatInfo({
  section,
  term,
  color,
}: SeatInfoProps): React.ReactElement {
  const { data: seatData, isLoading } = useSWR<SeatData>(
    ['seating', section.id, term],
    () => fetchSeating(section, term)
  );

  const textClass = getContentClassName(color);
  const labelClass =
    textClass === 'light-content' ? 'light-label' : 'dark-label';

  return (
    <div className="SeatInfo">
      <div className="seating-container">
        <div className="seating">
          <span className={`seats ${labelClass}`}>
            Seats Filled{' '}
            <span className={`status ${textClass}`}>
              {isLoading
                ? 'Loading...'
                : seatData?.inClass
                ? `${seatData.inClass.occupied}/${seatData.inClass.total}`
                : 'N/A'}
            </span>
          </span>
          <span className={`waitlist ${labelClass}`}>
            Waitlist Filled{' '}
            <span className={`status ${textClass}`}>
              {isLoading
                ? 'Loading...'
                : seatData?.waitlist
                ? `${seatData.waitlist.occupied}/${seatData.waitlist.total}`
                : 'N/A'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
