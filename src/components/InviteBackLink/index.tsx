import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// import { CLOUD_FUNCTION_BASE_URL } from '../../constants';

const handleInvite = async (inviteId: string | undefined): Promise<void> =>
  // The link should be changed to prod link, or we can choose the link based
  // on environment
  axios.post(
    `http://127.0.0.1:5001/gt-scheduler-web-dev/us-central1/handleFriendInvitation`,
    { inviteId }
  );
// .then((res) => {
//   console.log(res);
// })
// .catch((err) => {
//   console.error(err);
// });

export default function InviteBackLink(): React.ReactElement {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id && navigate) {
      handleInvite(id)
        .then(() => navigate('/'))
        .catch(() => navigate('/'));
    }
  }, [id, navigate]);

  return <div />;
}
