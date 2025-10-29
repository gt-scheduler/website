import React, { useState, useContext, useCallback } from 'react';
import Modal from '../Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Palette } from '../../types';
import {
  faCaretDown,
  faCheck,
  faPlus,
  faTimes,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { classes } from '../../utils/misc';
import { DEFAULT_PALETTE, SOFT_PALETTE, DEEP_PALETTE } from '../../constants';

export default function PaletteSelect(): React.ReactElement {
  const [opened, setOpened] = useState(false);

  return (
    <div
      className={classes('Button', 'Select', 'palette-select', `anchor-left`)}
      onClick={(): void => setOpened(!opened)}
    >
      <div className="text">Default Palette</div>
      <FontAwesomeIcon fixedWidth icon={faCaretDown} />

      {/* {opened && (
        <div className={classes('option-container', 'Palette-container', 'hover-container')}>
          <div className={classes('Palette')}>
            <div className="palette-header">Default Palette</div>

            {DEFAULT_PALETTE.map((colors, i) => (
              <div
                className="palette-row"
                key={i}
                onClick={(): void => handlePaletteChange('default')}
              >
                {colors.map((paletteColor) => (
                  <div
                    className={classes('color', 'frame')}
                    key={paletteColor}
                    style={{ backgroundColor: paletteColor }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className={classes('Palette')}>
            <div className="palette-header">Soft Palette</div>
            {SOFT_PALETTE.map((colors, i) => (
              <div
                className="palette-row"
                key={i}
                onClick={(): void => handlePaletteChange('soft')}
              >
                {colors.map((paletteColor) => (
                  <div
                    className={classes('color', 'frame')}
                    key={paletteColor}
                    style={{ backgroundColor: paletteColor }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className={classes('Palette')}>
            <div className="palette-header">Deep Palette</div>
            {DEEP_PALETTE.map((colors, i) => (
              <div
                className="palette-row"
                key={i}
                onClick={(): void => handlePaletteChange('deep')}
              >
                {colors.map((paletteColor) => (
                  <div
                    className={classes('color', 'frame')}
                    key={paletteColor}
                    style={{ backgroundColor: paletteColor }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}
