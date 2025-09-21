
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase for SSR
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// This guard is crucial to prevent "No Firebase App" errors.
if (!firebaseConfig.apiKey) {
    console.error("Firebase API Key is missing. Please check your NEXT_PUBLIC_FIREBASE_API_KEY environment variable. Firebase will not be initialized.");
} else {
    // Check if Firebase app already exists.
    if (!getApps().length) {
      try {
        app = initializeApp(firebaseConfig);
      } catch (e) {
        console.error("Failed to initialize Firebase app", e);
        // We will let the app continue to run, but Firebase services will fail.
      }
    } else {
      app = getApp();
    }

    // These will throw an error if the app is not initialized, which is intended behavior
    // if the config is missing, but our guard above prevents that.
    auth = getAuth(app!);
    db = getFirestore(app!);
    storage = getStorage(app!);
}


export { app, auth, db, storage };
