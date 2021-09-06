import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';

import './stylesheet.scss';

const GITHUB_ISSUE_URL =
  'https://github.com/gt-scheduler/website/issues/new?assignees=&labels=bug&template=bug-report----.md&title=';

export type ErrorDisplayProps = {
  errorDetails: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Renders the content for an error display,
 * directing the user to report the error to GitHub
 * and showing a collapsible section that includes details.
 */
export default function ErrorDisplay({
  errorDetails,
  children,
}: ErrorDisplayProps): React.ReactElement {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  return (
    <div className="error-display-outer">
      {children}
      <div>
        If the issue keeps happening, please consider filing{' '}
        <a href={GITHUB_ISSUE_URL} target="_blank" rel="noreferrer noopener">
          a new issue on the gt-scheduler GitHub
        </a>
        , and include the information below under &ldquo;Error Details&rdquo; in
        addition to what you were doing when the error occurred.
      </div>
      <div>
        The error has already been logged, but filing an issue lets you provide
        more information about what happened and makes it a lot easier for us to
        fix the bug. Thanks ❤
      </div>
      <div className="error-details">
        <button
          className="error-details-expander"
          onClick={(): void => setShowErrorDetails(!showErrorDetails)}
          type="button"
        >
          <FontAwesomeIcon
            fixedWidth
            icon={faCaretDown}
            style={{
              transform: showErrorDetails ? 'rotate(-90deg)' : 'none',
              marginRight: 8,
            }}
          />
          Error Details
        </button>
        {showErrorDetails && errorDetails}
      </div>
    </div>
  );
}
