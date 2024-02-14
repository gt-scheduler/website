import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import { CLOUD_FUNCTION_BASE_URL } from '../../constants';
import Spinner from '../Spinner';

import './stylesheet.scss';
import { AccountContext, SignedIn } from '../../contexts';

// eslint-disable-next-line no-shadow
enum LoadingState {
  LOADING,
  SUCCESS,
  ERROR,
}

const url = `${CLOUD_FUNCTION_BASE_URL}/handleFriendInvitation`;

const handleInvite = async (
  inviteId: string | undefined,
  token: string | void
): Promise<void> => {
  await axios({
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: {
      inviteId,
      token,
    },
  });
};

export default function InviteBackLink(): React.ReactElement {
  const accountContext = useContext(AccountContext);

  const navigate = useNavigate();
  const location = useLocation();

  const { id } = useParams();
  const [state, setState] = useState(LoadingState.LOADING);

  const redirectURL = useMemo(
    () => location.pathname.split('/#')[0] ?? '/',
    [location]
  );

  useEffect(() => {
    const handleInviteAsync = async (): Promise<void> => {
      const token = await (accountContext as SignedIn).getToken();
      if (id && navigate) {
        handleInvite(id, token)
          .then(() => {
            setState(LoadingState.SUCCESS);
            setTimeout(() => {
              navigate(redirectURL);
            }, 5000);
          })
          .catch(() => {
            setState(LoadingState.ERROR);
            setTimeout(() => {
              navigate(redirectURL);
            }, 10000);
          });
      }
    };
    handleInviteAsync().catch((err) => {
      console.error('Error handling invite', err);
    });
  }, [id, navigate, redirectURL]);

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
          navigate(redirectURL);
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
