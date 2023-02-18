import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const sendInvite = async (inviteId: string | undefined): Promise<void> =>
  axios.post(
    'http://127.0.0.1:5001/gt-scheduler-web-prod/us-central1/handleFriendInvitation',
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

  useEffect(() => {
    if (id && navigate) {
      sendInvite(id)
        .then(() => navigate('/'))
        .catch(() => navigate('/'));
    }
  }, [id, navigate]);

  return <div />;
}
