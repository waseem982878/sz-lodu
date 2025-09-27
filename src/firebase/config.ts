
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
// Removed getAnalytics as it's not used in a way that requires explicit handling here.

// Your web app's Firebase configuration
// These values are now sourced from environment variables for security
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

// This guard is crucial to prevent "Firebase app already exists" errors in Next.js.
// It also prevents initialization during the build process on Vercel.
if (process.env.VERCEL && process.env.CI) {
    // During Vercel build, Firebase can't be initialized due to missing env vars.
    // We provide mock/empty objects to prevent build failure.
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    storage = {} as FirebaseStorage;
} else {
    if (getApps().length === 0) {
       // Check if all required environment variables are set before initializing
        if (
            !firebaseConfig.apiKey ||
            !firebaseConfig.projectId ||
            !firebaseConfig.authDomain
        ) {
            console.error("Firebase environment variables are not set. Please check your .env.local file and Vercel project settings.");
        }
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}


export { app, auth, db, storage };
