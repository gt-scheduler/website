import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import './stylesheet.scss';

/**
 * Renders the top of an error display,
 * with an icon and a title saying 'An error occurred'
 */
export default function ErrorHeader(): React.ReactElement {
  return (
    <div className="error-header">
      <FontAwesomeIcon icon={faExclamationTriangle} />
      <h4>An error occurred :(</h4>
    </div>
  );
}
