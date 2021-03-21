import React, { useState } from 'react';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from '..';
import { classes } from '../../utils';

export default function Feedback() {
  const [expanded, setExpanded] = useState(false);
  const [submit, setSubmit] = useState(false);
  const [rating, setRating] = useState(null);

  const onSubmit = () => {
    // TODO implement API request
    setSubmit(true);
  };

  return (
    <div>
      {!expanded && (
        <Button
          className="FeedbackButton"
          onClick={() => setExpanded(true)}
          onMouse
        >
          <FontAwesomeIcon icon={faCommentAlt} size="2x" />
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
              <h3 className="FeedbackTitle">Feedback</h3>
              {!submit && (
                <div>
                  <p className="text">How would you rate your experience?</p>
                  <div className="FormButtons">
                    <Button
                      className={classes(
                        'FormButton',
                        rating === 0 && 'active'
                      )}
                      onClick={() => setRating(0)}
                    >
                      1
                    </Button>
                    <Button
                      className={classes(
                        'FormButton',
                        rating === 1 && 'active'
                      )}
                      onClick={() => setRating(1)}
                    >
                      2
                    </Button>
                    <Button
                      className={classes(
                        'FormButton',
                        rating === 2 && 'active'
                      )}
                      onClick={() => setRating(2)}
                    >
                      3
                    </Button>
                    <Button
                      className={classes(
                        'FormButton',
                        rating === 3 && 'active'
                      )}
                      onClick={() => setRating(3)}
                    >
                      4
                    </Button>
                    <Button
                      className={classes(
                        'FormButton',
                        rating === 4 && 'active'
                      )}
                      onClick={() => setRating(4)}
                    >
                      5
                    </Button>
                  </div>
                  <div className="ScoreLabels">
                    <span className="score" style={{ marginLeft: '4px' }}>
                      Poor
                    </span>
                    <span className="score" style={{ marginRight: '4px' }}>
                      Great
                    </span>
                  </div>
                  <textarea
                    className="FeedbackTextArea"
                    placeholder="Please let us know if you have any more feedback!"
                  />
                  <Button
                    className="SubmitButton"
                    onClick={onSubmit}
                    disabled={rating == null}
                  >
                    Submit
                  </Button>
                </div>
              )}
              {submit && (
                <div className="submitted">
                  <p className="submitted-thanks text">
                    <span>Thank you for your feedback!</span>
                  </p>
                  <div>
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
