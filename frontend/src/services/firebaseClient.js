/**
 * Firebase client — inicializa el SDK Web de Firebase para
 * escuchar cambios en Realtime Database sin polling.
 */
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCLE8ZTN_H8CJEzBZvelBuFl5WKc0YtVQY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ctbt-4aa9a.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://ctbt-4aa9a-default-rtdb.firebaseio.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ctbt-4aa9a",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ctbt-4aa9a.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "626955262469",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:626955262469:web:8fe46da03a456d28715a6c",
};

const firebaseApp = initializeApp(firebaseConfig);
export const rtdb = getDatabase(firebaseApp);
