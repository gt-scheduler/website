import React, { useState } from 'react';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamation, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from '..';

export default function Feedback() {
  const [expanded, setExpanded] = useState(false);
  const [submit, setSubmit] = useState(false);
  const buttonValues = [1, 2, 3, 4, 5];

  return (
    <div>
      {!expanded && (
        <Button className="FeedbackButton" onClick={() => setExpanded(true)}>
          <FontAwesomeIcon icon={faExclamation} />
        </Button>
      )}
      {expanded && (
        <div>
          <form className="FeedbackForm">
            <div className="container">
              <FontAwesomeIcon
                icon={faTimes}
                className="CloseIcon"
                onClick={() => setExpanded(false)}
              />
              <h3>Feedback</h3>
              {!submit && (
                <div>
                  <p className="text">How would you rate your experience?</p>
                  <div className="FormButtons">
                    {buttonValues.map((number) => (
                      <div>
                        <Button className="FormButton">{number}</Button>
                      </div>
                    ))}
                  </div>
                  <span className="score">Poor</span>
                  <span className="score" style={{ marginLeft: '100px' }}>
                    Great
                  </span>
                  <textarea
                    className="TextArea"
                    placeholder="Please let us know if you have anything more feedback!"
                  />
                  <Button
                    className="SubmitButton"
                    onClick={() => setSubmit(true)}
                  >
                    Submit
                  </Button>
                </div>
              )}
              {submit && (
                <div>
                  <p className="text" style={{ marginTop: '59px' }}>
                    Thank you for your feedback!
                  </p>
                  <div style={{ marginTop: '77px' }}>
                    <Button
                      className="SubmitButton"
                      onClick={() => setExpanded(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
