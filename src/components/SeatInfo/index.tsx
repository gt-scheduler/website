import React, { useEffect, useState } from 'react';

import { Section as SectionBean } from '../../data/beans';

import './stylesheet.scss';

export type OccupiedInfo = {
  occupied: number;
  total: number;
};

export type SeatInfoProps = {
  section: SectionBean;
  term: string;
};

type SeatData = {
  inClass: OccupiedInfo | null;
  waitlist: OccupiedInfo | null;
};

export default function SeatInfo({
  section,
  term,
}: SeatInfoProps): React.ReactElement {
  const [seatData, setSeatData] = useState<SeatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    section
      .fetchSeating(term)
      .then((raw) => {
        if (!mounted) return;
        if (raw[0].length === 0) {
          setSeatData({ inClass: null, waitlist: null });
        } else {
          setSeatData({
            inClass: {
              occupied: Number(raw[0][1] ?? 0),
              total: Number(raw[0][0] ?? 0),
            },
            waitlist: {
              occupied: Number(raw[0][3] ?? 0),
              total: Number(raw[0][2] ?? 0),
            },
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setSeatData({ inClass: null, waitlist: null });
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [section, term]);

  return (
    <div className="SeatInfo">
      <div className="seating-container">
        <div className="seating">
          <span className="seats">
            Seats Filled{' '}
            <span className="status">
              {isLoading
                ? 'Loading...'
                : seatData?.inClass
                ? `${seatData.inClass.occupied}/${seatData.inClass.total}`
                : 'N/A'}
            </span>
          </span>
          <span className="waitlist">
            Waitlist Filled{' '}
            <span className="status">
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
