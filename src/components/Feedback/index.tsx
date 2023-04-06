import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentAlt, faTimes } from '@fortawesome/free-solid-svg-icons';

import { Button } from '..';
import { classes } from '../../utils/misc';
import { BACKEND_BASE_URL } from '../../constants';

import './stylesheet.scss';

export default function Feedback(): React.ReactElement {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [submit, setSubmit] = useState<boolean>(false);
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (): void => {
    setLoading(true);
    // Add 1 to the rating to move it from [0,4] to [1,5]
    submitFeedback({ rating: (rating ?? 0) + 1, feedback })
      .then(() => {
        setSubmit(true);
        setLoading(false);
      })
      .catch(() => {
        setSubmit(true);
        setLoading(false);
      });
  };

  const resetSession = (): void => {
    setExpanded(false);
    setSubmit(false);
    setRating(null);
    setFeedback('');
  };

  return (
    <>
      {!expanded && (
        <div className="FeedbackButtonWrapper">
          <Button
            className="FeedbackButton"
            onClick={(): void => setExpanded(true)}
          >
            <FontAwesomeIcon icon={faCommentAlt} size="2x" />
          </Button>
        </div>
      )}
      {expanded && (
        <div>
          <form className="FeedbackForm">
            <div className="container">
              <FontAwesomeIcon
                icon={faTimes}
                className="CloseIcon"
                onClick={(): void =>
                  submit ? resetSession() : setExpanded(false)
                }
              />
              <h3 className="FeedbackTitle">Feedback</h3>
              {!submit && (
                <div>
                  <p className="text">How would you rate your experience?</p>
                  <div className="FormButtons">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Button
                        key={i}
                        className={classes(
                          'FormButton',
                          rating === i - 1 && 'active'
                        )}
                        onClick={(): void => setRating(i - 1)}
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
                    onChange={(event): void => setFeedback(event.target.value)}
                    value={feedback}
                  />
                  <Button
                    className="SubmitButton"
                    onClick={handleSubmit}
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
                      onClick={(): void => resetSession()}
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
    </>
  );
}

async function submitFeedback({
  rating,
  feedback,
}: {
  rating: number;
  feedback: string;
}): Promise<void> {
  const url = `${BACKEND_BASE_URL}/feedback`;
  await axios({
    method: 'post',
    url,
    data: {
      rating,
      feedback,
    },
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
  });
}
