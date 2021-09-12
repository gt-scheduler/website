import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import './stylesheet.scss';

/**
 * Renders the top of a warning,
 * with an icon and a title saying 'Warning'
 */
export default function WarningHeader(): React.ReactElement {
  return (
    <div className="warning-header">
      <FontAwesomeIcon icon={faExclamationCircle} />
      <h4>Warning</h4>
    </div>
  );
}
