/* eslint-disable no-console */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import App from '../App';
import InviteBackLink from '../InviteBackLink';

export default function RouterComponent(): React.ReactElement {
  console.log('BASE_URL', process.env.PUBLIC_URL);
  console.log('NODE_ENV', process.env.NODE_ENV);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/invite/:id" element={<InviteBackLink />} />
        <Route path="/pr-preview/:pr/invite/:id" element={<InviteBackLink />} />
        <Route
          path="/pr-preview/:pr/*"
          element={<Navigate to="/pr-preview/:pr/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
