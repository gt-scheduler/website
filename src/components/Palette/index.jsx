import React from 'react';
import { classes } from '../../utils';
import { PALETTE } from '../../constants';
import './stylesheet.scss';

export function Palette({ className, color, onSelectColor, ...restProps }) {
  return (
    <div className={classes('Palette', className)} {...restProps}>
      {PALETTE.map((colors, i) => (
        <div className="palette-row" key={i}>
          {colors.map((paletteColor) => (
            <div
              className={classes('color', paletteColor === color && 'frame')}
              key={paletteColor}
              style={{ backgroundColor: paletteColor }}
              onClick={() => onSelectColor(paletteColor)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
