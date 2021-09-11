import React from 'react';

import { classes } from '../../utils/misc';
import { PALETTE } from '../../constants';

import './stylesheet.scss';

export type PaletteProps = {
  className?: string;
  color: string | null;
  onSelectColor: (newColor: string) => void;
  onMouseLeave: () => void;
};

export default function Palette({
  className,
  color,
  onSelectColor,
  onMouseLeave,
}: PaletteProps): React.ReactElement {
  return (
    <div className={classes('Palette', className)} onMouseLeave={onMouseLeave}>
      {PALETTE.map((colors, i) => (
        <div className="palette-row" key={i}>
          {colors.map((paletteColor) => (
            <div
              className={classes('color', paletteColor === color && 'frame')}
              key={paletteColor}
              style={{ backgroundColor: paletteColor }}
              onClick={(): void => onSelectColor(paletteColor)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
