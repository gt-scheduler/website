import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios, { AxiosError, AxiosResponse } from 'axios';

import useFirebaseAuth from '../../data/hooks/useFirebaseAuth';
import { CLOUD_FUNCTION_BASE_URL } from '../../constants';
import { SignedIn } from '../../contexts';
import Spinner from '../Spinner';

import './stylesheet.scss';

// eslint-disable-next-line no-shadow
enum LoadingState {
  LOADING,
  SUCCESS,
  ERROR,
}

type HandleInvitationResponse = {
  email: string;
  term: string;
};

interface ServerError extends AxiosError {
  response: ServerErrorResponse;
}

interface ServerErrorResponse extends AxiosResponse {
  data: {
    message: string;
  };
}

const url = `${CLOUD_FUNCTION_BASE_URL}/handleFriendInvitation`;

const handleInvite = async (
  inviteId: string | undefined,
  token: string | void
): Promise<HandleInvitationResponse> => {
  const data = JSON.stringify({
    inviteId,
    token,
  });
  const res = await axios.post<HandleInvitationResponse>(url, `data=${data}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return res.data;
};

export default function InviteBackLink(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();

  const { id } = useParams();
  const [state, setState] = useState(LoadingState.LOADING);

  const redirectURL = useMemo(
    () =>
      location.pathname.includes('/#')
        ? location.pathname.split('/#')[0] ?? '/'
        : '/',
    [location]
  );

  const accountContext = useFirebaseAuth();

  useEffect(() => {
    const handleInviteAsync = async (): Promise<
      HandleInvitationResponse | undefined
    > => {
      if (accountContext.type === 'loaded') {
        const token = await (accountContext.result as SignedIn).getToken();
        return handleInvite(id, token);
      }
      return undefined;
    };

    const { type } = accountContext;

    if (
      type === 'loaded' &&
      accountContext.result.type === 'signedIn' &&
      redirectURL !== undefined
    ) {
      handleInviteAsync()
        .then((resp) => {
          setState(LoadingState.SUCCESS);
          navigate(
            `${redirectURL}?email=${resp?.email ?? ''}&term=${
              resp?.term ?? ''
            }&status=success&inviteId=${id ?? ''}`
          );
        })
        .catch((err: ServerError) => {
          setState(LoadingState.ERROR);
          navigate(
            `${redirectURL}?email=none&status=${
              err.response?.data.message ?? ''
            }&inviteId=${id ?? ''}`
          );
        });
    } else if (
      type === 'loaded' &&
      accountContext.result.type !== 'signedIn' &&
      redirectURL !== undefined
    ) {
      navigate(
        `${redirectURL}?email=none&status=not-logged-in&inviteId=${id ?? ''}`
      );
    }
  }, [id, navigate, redirectURL, accountContext.type]); // eslint-disable-line react-hooks/exhaustive-deps

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
