import React, { useEffect, useRef, useState } from 'react';

import { classes } from '../../utils/misc';
import { DEFAULT_PALETTE, PRESET_PALETTE } from '../../constants';

import './stylesheet.scss';

export type PaletteProps = {
  className?: string;
  color: string | null;
  onSelectColor: (newColor: string) => void;
};

export default function Palette({
  className,
  color,
  onSelectColor,
}: PaletteProps): React.ReactElement {
  const defaultRowRef = useRef<HTMLDivElement | null>(null);
  const [rowHeight, setRowHeight] = useState<number>(0);

  useEffect((): (() => void) => {
    const updateHeight = (): void => {
      if (defaultRowRef.current) {
        setRowHeight(defaultRowRef.current.offsetHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return (): void => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <div className={classes('Palette-container', 'hover-container')}>
      <div className={classes('Palette')}>
        <div className="palette-header">Default colors</div>

        {DEFAULT_PALETTE.map((colors, i) => (
          <div
            className="palette-row"
            key={i}
            ref={i === 0 ? defaultRowRef : null}
          >
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

      <div className={classes('Palette', 'preset-palette')}>
        <div className="palette-header">Preset palettes</div>
        {PRESET_PALETTE.map((colors, i) => (
          <div
            className="palette-row preset-row"
            key={i}
            style={rowHeight ? { height: `${rowHeight}px` } : undefined}
          >
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
    </div>
  );
}
