import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import App from '../App';
import EmailInviteConfirmation from '../EmailInviteConfirmation';
import InviteBackLink from '../InviteBackLink';

export default function RouterComponent(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/invite/:id" element={<InviteBackLink />} />
        <Route path="/confirm-invite" element={<EmailInviteConfirmation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
