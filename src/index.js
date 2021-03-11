import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import App from './components/App';
import 'normalize.css';
import './stylesheet.scss';

// Only initialize sentry on production
if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.log('Initializing Sentry');
  Sentry.init({
    dsn:
      'https://cfb29f8e240b468f971c168e3369807d@o415387.ingest.sentry.io/5672156',
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.8
  });
}

ReactDOM.render(<App />, document.getElementById('root'));
