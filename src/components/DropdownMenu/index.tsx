import React, { useState } from 'react';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Button } from '..';
import { classes } from '../../utils/misc';

export type DropdownMenuProps = {
  className?: string;
  style?: React.CSSProperties;
  menuAnchor?: 'left' | 'right';
  children: React.ReactNode;
  items: DropdownMenuAction[];
  disabled?: boolean;
};

export interface DropdownMenuAction {
  label: React.ReactNode;
  icon?: IconDefinition;
  onClick?: () => void;
}

export default function DropdownMenu({
  className,
  style,
  menuAnchor = 'left',
  children,
  items,
  disabled = false,
}: DropdownMenuProps): React.ReactElement {
  const [opened, setOpened] = useState(false);

  // TODO deduplicate base component with Select?
  return (
    <div
      className={classes(
        'Button',
        'Select',
        disabled && 'disabled',
        className,
        `anchor-${menuAnchor}`
      )}
      onClick={(): void => {
        if (!disabled) setOpened(!opened);
      }}
      style={style}
    >
      {children}
      {opened && (
        <div className="intercept" onClick={(): void => setOpened(false)} />
      )}
      {opened && (
        <div className="option-container">
          {items.map(({ label, icon, onClick }, i) => (
            <div
              className={classes('option', onClick == null && 'text-option')}
              key={i}
            >
              {onClick != null ? (
                <Button className="option-button-text" onClick={onClick}>
                  {icon != null && (
                    <FontAwesomeIcon
                      fixedWidth
                      icon={icon}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  {label}
                </Button>
              ) : (
                <div
                  className="option-text"
                  onClick={(e): void => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {icon != null && (
                    <FontAwesomeIcon
                      fixedWidth
                      icon={icon}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  {label}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
