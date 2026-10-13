import React from 'react';

import './stylesheet.scss';

export type ToggleButtonProps = {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

export default function ToggleButton({
  label,
  active,
  disabled = false,
  onClick,
  className = '',
}: ToggleButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      className={`travel-toggle${active ? ' travel-toggle--active' : ''}${
        className ? ` ${className}` : ''
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      <span className="travel-toggle__indicator" aria-hidden="true" />
      <span className="travel-toggle__label">{label}</span>
    </button>
  );
}
