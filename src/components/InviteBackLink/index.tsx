import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import { CLOUD_FUNCTION_BASE_URL } from '../../constants';
import Spinner from '../Spinner';

import './stylesheet.scss';

// eslint-disable-next-line no-shadow
enum LoadingState {
  LOADING,
  SUCCESS,
  ERROR,
}

const url = `${CLOUD_FUNCTION_BASE_URL}/handleFriendInvitation`;

const handleInvite = async (inviteId: string | undefined): Promise<void> => {
  const requestData = JSON.stringify({ inviteId });
  await axios({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: `data=${requestData}`,
  });
};

export default function InviteBackLink(): React.ReactElement {
  const navigate = useNavigate();
  const { id } = useParams();
  const [state, setState] = useState(LoadingState.LOADING);

  useEffect(() => {
    if (id && navigate) {
      handleInvite(id)
        .then(() => {
          setState(LoadingState.SUCCESS);
          setTimeout(() => {
            navigate('/');
          }, 5000);
        })
        .catch(() => {
          setState(LoadingState.ERROR);
          setTimeout(() => {
            navigate('/');
          }, 10000);
        });
    }
  }, [id, navigate]);

  if (state === LoadingState.LOADING) {
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
      {state === LoadingState.SUCCESS ? (
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
        <img
          alt="Bits of Good Logo"
          height={44}
          width={243}
          src="/bitsOfGood.svg"
        />
      </a>
    </div>
  );
}
