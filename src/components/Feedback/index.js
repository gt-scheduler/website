import React, { useState } from 'react';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from '..';
import { classes } from '../../utils';

import { FormSubmit } from '../../beans';

export default function Feedback() {
  const [expanded, setExpanded] = useState(false);
  const [submit, setSubmit] = useState(false);
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = () => {
    setLoading(true);
    // Add 1 to the rating to move it from [0,4] to [1,5]
    FormSubmit({ rating: rating + 1, feedback })
      .then(() => {
        setSubmit(true);
        setLoading(false);
      })
      .catch(() => {
        setSubmit(true);
        setLoading(false);
      });
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
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Button
                        className={classes(
                          'FormButton',
                          rating === i - 1 && 'active'
                        )}
                        onClick={() => setRating(i - 1)}
                      >
                        {i}
                      </Button>
                    ))}
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
                    onChange={(event) => setFeedback(event.target.value)}
                    value={feedback}
                  />
                  <Button
                    className="SubmitButton"
                    onClick={onSubmit}
                    disabled={rating == null || loading}
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
