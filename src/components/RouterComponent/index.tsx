import React from 'react';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom';

import App from '../App';
import InviteBackLink from '../InviteBackLink';

export default function RouterComponent(): React.ReactElement {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/invite/:id" element={<InviteBackLink />} />
        <Route path="/pr-preview/:id">
          <Route path="" element={<App />} />
          <Route path="invite/:id" element={<InviteBackLink />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
