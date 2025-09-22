
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyATZDqpzbFDaDz0JmR-uOneFbLklNmfPZ8",
  authDomain: "ludo-king-battles.firebaseapp.com",
  databaseURL: "https://ludo-king-battles-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ludo-king-battles",
  storageBucket: "ludo-king-battles.firebasestorage.app",
  messagingSenderId: "211677946988",
  appId: "1:211677946988:web:05c3430192d6e08f68a449",
  measurementId: "G-9EM7PMEGEP"
};

// Initialize Firebase for SSR
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics;

// This guard is crucial to prevent "No Firebase App" errors.
if (typeof window !== 'undefined' && !getApps().length) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        analytics = getAnalytics(app);
    } catch (e) {
         console.error("Failed to initialize Firebase app or its services", e);
    }
} else if (getApps().length > 0) {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    if (typeof window !== 'undefined') {
        analytics = getAnalytics(app);
    }
}


export { app, auth, db, storage, analytics };

