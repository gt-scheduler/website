import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { ErrorWithFields, softError } from '../log';
import { AnyScheduleData } from './types';

// This data is not secret; it is included in the application bundle.
// Supply these environment variables when developing locally.
const firebaseConfig = {
  apiKey: process.env['REACT_APP_FIREBASE_API_KEY'],
  authDomain: process.env['REACT_APP_FIREBASE_AUTH_DOMAIN'],
  projectId: process.env['REACT_APP_FIREBASE_PROJECT_ID'],
  storageBucket: process.env['REACT_APP_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: process.env['REACT_APP_FIREBASE_MESSAGING_SENDER_ID'],
  appId: process.env['REACT_APP_FIREBASE_APP_ID'],
};

/**
 * Whether Firebase authentication is enabled in this environment.
 * To enable, supply the 5 Firebase config environment variables.
 */
export const isAuthEnabled =
  firebaseConfig.apiKey != null && firebaseConfig.apiKey !== '';

/* eslint-disable import/no-mutable-exports */
let auth: firebase.auth.Auth = null as unknown as firebase.auth.Auth;
let db: firebase.firestore.Firestore =
  null as unknown as firebase.firestore.Firestore;
type SchedulesCollection =
  firebase.firestore.CollectionReference<AnyScheduleData>;
let schedulesCollection: SchedulesCollection =
  null as unknown as SchedulesCollection;
/* eslint-enable import/no-mutable-exports */
if (isAuthEnabled) {
  const app = firebase.initializeApp(firebaseConfig);

  auth = app.auth();
  db = app.firestore();
  schedulesCollection = db.collection('schedules') as SchedulesCollection;

  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
    softError(
      new ErrorWithFields({
        message: 'error when configuring firebase auth persistence',
        source: err,
      })
    );
  });
}

export { auth, db, schedulesCollection };
export { firebase };

// Configure the enabled auth providers that firebase UI displays as options
export const authProviders = [
  firebase.auth.EmailAuthProvider.PROVIDER_ID,
  firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  firebase.auth.GithubAuthProvider.PROVIDER_ID,
];
