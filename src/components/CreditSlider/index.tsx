import React from 'react';
import Slider from '@mui/material/Slider';

import './stylesheet.scss';

export type CreditSliderProps = {
  value: number;
  onChange: (event: Event, newValue: number | number[]) => void;
};

export default function CreditSlider({
  value,
  onChange,
}: CreditSliderProps): React.ReactElement {
  return (
    <Slider
      className="slider"
      min={1}
      max={12}
      value={value}
      valueLabelDisplay="auto"
      onChange={onChange}
      marks
    />
  );
}
