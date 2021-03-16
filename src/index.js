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
      'https://8955ef982197469e97c7644a8c090db1@o552970.ingest.sentry.io/5679614',
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.8
  });
}

ReactDOM.render(<App />, document.getElementById('root'));
