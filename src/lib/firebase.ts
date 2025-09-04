import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "track-it-fencing.firebaseapp.com",
  projectId: "track-it-fencing",
  storageBucket: "track-it-fencing.appspot.com",
  messagingSenderId: "1022114481394",
  appId: "1:1022114481394:web:YOUR_APP_ID",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, "us-central1");
const storage = getStorage(app);

export { app, db, auth, functions, storage };
