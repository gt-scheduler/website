import React from 'react';
import {
  faChevronLeft,
  faChevronRight,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './stylesheet.scss';

export type MajorRestrictionsViewProps = {
  majors: string[];
  onBack?: () => void;
  onHide?: () => void;
  courseName?: string;
};

export function MajorRestrictionsView({
  majors,
  onBack,
  onHide,
  courseName = undefined,
}: MajorRestrictionsViewProps): React.ReactElement {
  return (
    <div className="modal-restrictions-body">
      <div className="modal-header-custom">
        <div className="modal-header-back-title-container">
          {onBack && (
            <div
              className="back-icon"
              onClick={onBack}
              role="button"
              tabIndex={0}
            >
              <FontAwesomeIcon icon={faChevronLeft} size="lg" />
            </div>
          )}
          <h3>Major Restrictions</h3>
        </div>

        <div
          className="close-x-icon"
          onClick={onHide}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <FontAwesomeIcon icon={faXmark} size="lg" />
        </div>
      </div>

      {onBack && courseName && (
        <div className="modal-section-details-container">
          <div className="modal-course-name" onClick={onBack}>
            {courseName} Section Details
          </div>
          <div className="modal-section-chevron">
            <FontAwesomeIcon icon={faChevronRight} />
          </div>
          Major Restrictions
        </div>
      )}

      <p>
        <strong>Must be enrolled in one of the following Majors:</strong>
      </p>

      <ul className="no-bullet-list">
        {majors.map((major, i) => (
          <li key={i}>{major}</li>
        ))}
      </ul>
    </div>
  );
}
