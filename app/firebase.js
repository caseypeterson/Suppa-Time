// app/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBnFSTAY9jZT6jKAZzXMENECNG3gzgumsg",
  authDomain: "suppa-time.firebaseapp.com",
  projectId: "suppa-time",
  storageBucket: "suppa-time.firebasestorage.app",
  messagingSenderId: "848567631853",
  appId: "1:848567631853:web:9b56dc947a3ed7573671e4",
  measurementId: "G-FG2ZZZLEC0"
};

const app = initializeApp(firebaseConfig); // Single app instance
const auth = getAuth(app); // Auth instance
const db = getFirestore(app); // Firestore instance

export { app, auth, db };
