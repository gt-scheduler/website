import React from 'react';
import Rating from '@mui/material/Rating';

import './stylesheet.scss';

export type Variant = 'stars' | 'time';

export type StarsValue = 1 | 2 | 3 | 4 | 5 | null;

export type TimeValue = { hours: number | null; minutes: number | null };

export type TimeLimits = {
  hours: { min: number; max: number };
  minutes: { min: number; max: number };
};

export type StarProps = {
  variant: 'stars';
  value: StarsValue;
  oneStarLabel: string;
  fiveStarLabel: string;
  onChange: (value: StarsValue) => void;
};

export type TimeProps = {
  variant: 'time';
  value: TimeValue;
  limits?: TimeLimits;
  onChange: (value: TimeValue) => void;
};

export type RateEntryProps = {
  heading: string;
} & (TimeProps | StarProps);

export default function RateEntry({
  variant,
  heading,
  ...props
}: RateEntryProps): React.ReactElement {
  switch (variant) {
    case 'stars': {
      const { value, onChange, oneStarLabel, fiveStarLabel } =
        props as StarProps;

      return (
        <div className={`rateentry ${variant}`}>
          <div className="heading">{heading}</div>
          <div className="stars-container">
            <Rating
              value={value}
              size="large"
              className="star"
              onChange={(_, newValue): void => {
                if (newValue && [1, 2, 3, 4, 5].includes(newValue)) {
                  onChange(newValue as StarsValue);
                }
              }}
              sx={{
                '& .MuiRating-iconFilled': {
                  color: '#d79758',
                },
                '& .MuiRating-iconHover': {
                  color: '#d79758',
                },
                '& .MuiRating-iconEmpty': {
                  color: '#808080',
                },
              }}
            />
            <div className="labels">
              <span>1 - {oneStarLabel}</span>
              <span>5 - {fiveStarLabel}</span>
            </div>
          </div>
        </div>
      );
    }

    case 'time': {
      const { value, onChange, limits } = props as TimeProps;

      const clamp = (num: number, min: number, max: number): number =>
        Math.min(Math.max(num, min), max);

      const handleHoursChange = (
        e: React.ChangeEvent<HTMLInputElement>
      ): void => {
        const raw = e.target.value;
        const hours = raw === '' ? null : Number(raw.replace(/^0+(?=\d)/, ''));

        const clamped =
          hours === null
            ? null
            : limits
            ? clamp(hours, limits.hours.min, limits.hours.max)
            : hours;

        onChange({ ...value, hours: clamped });
      };

      const handleMinutesChange = (
        e: React.ChangeEvent<HTMLInputElement>
      ): void => {
        const raw = e.target.value;
        const minutes =
          raw === '' ? null : Number(raw.replace(/^0+(?=\d)/, ''));

        const clamped =
          minutes === null
            ? null
            : limits
            ? clamp(minutes, limits.minutes.min, limits.minutes.max)
            : minutes;

        onChange({ ...value, minutes: clamped });
      };

      return (
        <div className={`rateentry ${variant}`}>
          <div className="heading">{heading}</div>
          <div className="time-container">
            <div className="time-input-group">
              <input
                type="number"
                className="time-input"
                value={value.hours ?? ''}
                onChange={handleHoursChange}
                onKeyDown={(e): void => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                min={0}
                max={168}
              />
              <div className="time-label">Hours</div>
            </div>
            <div className="time-input-group">
              <input
                type="number"
                className="time-input"
                value={value.minutes ?? ''}
                onChange={handleMinutesChange}
                onKeyDown={(e): void => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                min={0}
                max={59}
              />
              <div className="time-label">Minutes</div>
            </div>
          </div>
        </div>
      );
    }

    default:
      return <div />;
  }
}
