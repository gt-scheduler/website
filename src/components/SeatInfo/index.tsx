import React, { useEffect, useMemo, useState } from 'react';

import {
  getContentClassName,
  getLabelClassName,
  normalizeSeatingData,
} from '../../utils/misc';
import { Section as SectionBean } from '../../data/beans';
import { ErrorWithFields, softError } from '../../log';
import { OccupiedInfo } from '../../types';

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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (section) {
      section
        .fetchSeating(term)
        .then(() => {
          setIsLoaded(true);
        })
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'error fetching section seating',
              source: err,
              fields: {
                crn: section.crn,
                term,
              },
            })
          );
        });
    }
  }, [section, term]);

  const seating = useMemo(() => {
    if (!isLoaded) {
      return { inClass: null, waitlist: null };
    }
    return normalizeSeatingData(section.seating);
  }, [isLoaded, section?.seating]);

  // Derive styling classes based on Section's color (passed down from Section)
  const textClass = getContentClassName(color);
  const labelClass = getLabelClassName(color);

  return (
    <div className="SeatInfo">
      <div className="seating-container">
        <div className="seating">
          <SeatingStat
            label="Seats Filled"
            info={seating?.inClass ?? null}
            isLoading={!isLoaded}
            textClass={textClass}
            labelClass={labelClass}
          />
          <SeatingStat
            label="Waitlist Filled"
            info={seating?.waitlist ?? null}
            isLoading={!isLoaded}
            textClass={textClass}
            labelClass={labelClass}
          />
        </div>
      </div>
    </div>
  );
}
