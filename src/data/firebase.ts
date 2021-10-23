import firebase from 'firebase';

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
