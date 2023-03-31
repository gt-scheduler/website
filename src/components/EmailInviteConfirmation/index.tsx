import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './stylesheet.scss';

export default function EmailInviteConfirmation(): React.ReactElement {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate('/');
    }, 30000);
  });

  return (
    <div className="EmailInviteConfirmation">
      <h1>Congratulations on Adding a New Schedule to your View!</h1>
      <p>You are being redirected to our main site, please wait...</p>
      <p>
        If you have not been redirected in 30 seconds, please click the button
        below
      </p>
      <button type="button" className="continue-button">
        Continue
      </button>

      <a className="footer" href="https://bitsofgood.org/">
        <img alt="Bits of Good Logo" src="bitsOfGood.png" />
      </a>
    </div>
  );
}
