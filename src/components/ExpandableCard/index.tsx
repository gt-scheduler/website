import React, { useState } from 'react';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type ExpandableCardProps = {
  label?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Renders a simple expandable card that has a button
 * which can be clicked to render all content.
 */
export default function ExpandableCard({
  children,
  label = 'Details',
  className,
  style,
}: ExpandableCardProps): React.ReactElement {
  const [showChildren, setShowChildren] = useState(false);

  return (
    <div className={classes('expandable-card', className)} style={style}>
      <button
        className="expandable-card-button"
        onClick={(): void => setShowChildren(!showChildren)}
        type="button"
      >
        <FontAwesomeIcon
          fixedWidth
          icon={faCaretDown}
          style={{
            transform: showChildren ? 'rotate(-90deg)' : 'none',
            marginRight: 8,
          }}
        />
        {label}
      </button>
      {showChildren && children}
    </div>
  );
}
