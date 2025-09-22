
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
// Removed getAnalytics as it's not used in a way that requires explicit handling here.

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATZDqpzbFDaDz0JmR-uOneFbLklNmfPZ8",
  authDomain: "ludo-king-battles.firebaseapp.com",
  databaseURL: "https://ludo-king-battles-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ludo-king-battles",
  storageBucket: "ludo-king-battles.appspot.com",
  messagingSenderId: "211677946988",
  appId: "1:211677946988:web:05c3430192d6e08f68a449",
  measurementId: "G-9EM7PMEGEP"
};

// Initialize Firebase for SSR
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// This guard is crucial to prevent "Firebase app already exists" errors in Next.js.
if (getApps().length) {
    app = getApp();
} else {
    app = initializeApp(firebaseConfig);
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

export { app, auth, db, storage };
