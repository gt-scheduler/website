import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import { CLOUD_FUNCTION_BASE_URL } from '../../constants';
import Spinner from '../Spinner';

import './stylesheet.scss';

const handleInvite = async (inviteId: string | undefined): Promise<void> =>
  // The link should be changed to prod link, or we can choose the link based
  // on environment
  axios.post(
    `${CLOUD_FUNCTION_BASE_URL}/handleFriendInvitation`,
    { inviteId },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

export default function InviteBackLink(): React.ReactElement {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(true);

  useEffect(() => {
    if (id && navigate) {
      handleInvite(id)
        .then(() => {
          setTimeout(() => {
            navigate('/');
          }, 5000);
        })
        .catch(() => {
          setSuccess(false);
          setTimeout(() => {
            navigate('/');
          }, 10000);
        })
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="Loading">
        <Spinner size="normal" style={{ opacity: 0.6 }} />
        <h4>Loading</h4>
        <div>friend schedule invite</div>
      </div>
    );
  }

  return (
    <div className="EmailInviteConfirmation">
      {success ? (
        <h1>Congratulations on Adding a New Schedule to your View!</h1>
      ) : (
        <h1>We&apos;ve Encountered an Error, Please Try Again</h1>
      )}
      <p>You are being redirected to our main site, please wait...</p>
      <p>
        If you have not been redirected in 30 seconds, please click the button
        below
      </p>
      <button
        type="button"
        className="continue-button"
        onClick={(): void => {
          navigate('/');
        }}
      >
        Continue
      </button>

      <a className="footer" href="https://bitsofgood.org/">
        <img alt="Bits of Good Logo" src="/bitsOfGood.png" />
      </a>
    </div>
  );
}
