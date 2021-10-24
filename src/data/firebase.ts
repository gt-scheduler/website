import firebase from 'firebase';

import { ErrorWithFields, softError } from '../log';

// This data is not secret; it is included in the application bundle.
// Change it when developing locally.
// TODO figure out better method ^
const firebaseConfig = {
  apiKey: 'AIzaSyDzzT30jbX-KznDKMCVq3URIYPJZz8AOp4',
  authDomain: 'gt-scheduler-jazev-dev.firebaseapp.com',
  projectId: 'gt-scheduler-jazev-dev',
  storageBucket: 'gt-scheduler-jazev-dev.appspot.com',
  messagingSenderId: '165974928508',
  appId: '1:165974928508:web:ef36ee3bdc3be2c323adf9',
};

const app = firebase.initializeApp(firebaseConfig);

export const auth = app.auth();
export const db = app.firestore();
export const schedulesCollection = db.collection('schedules');

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
  softError(
    new ErrorWithFields({
      message: 'error when configuring firebase auth persistence',
      source: err,
    })
  );
});

export { firebase };

// Configure the enabled auth providers that firebase UI displays as options
export const authProviders = [
  firebase.auth.EmailAuthProvider.PROVIDER_ID,
  firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  firebase.auth.GithubAuthProvider.PROVIDER_ID,
];
