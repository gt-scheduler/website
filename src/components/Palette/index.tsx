import React from 'react';

import { classes } from '../../utils/misc';
import { DEFAULT_PALETTE, SOFT_PALETTE, DEEP_PALETTE } from '../../constants';
import { Palette as PaletteType } from '../../types';

import './stylesheet.scss';

export type PaletteProps = {
  className?: string;
  palette: PaletteType;
  color: string | null;
  onSelectColor: (newColor: string) => void;
  onMouseLeave: () => void;
};

export default function Palette({
  className,
  palette,
  color,
  onSelectColor,
  onMouseLeave,
}: PaletteProps): React.ReactElement {
  const paletteColors =
    palette === 'default'
      ? DEFAULT_PALETTE
      : palette === 'soft'
      ? SOFT_PALETTE
      : DEEP_PALETTE;

  return (
    <div className={classes('Palette', className)} onMouseLeave={onMouseLeave}>
      {paletteColors.map((colors, i) => (
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
