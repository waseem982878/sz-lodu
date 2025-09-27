
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration is read from environment variables
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

// Initialize Firebase for SSR and client-side
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// This guard prevents re-initializing the app on every render in Next.js
if (getApps().length === 0) {
    // Check if all required environment variables are set before initializing
    if (
        firebaseConfig.apiKey &&
        firebaseConfig.projectId &&
        firebaseConfig.authDomain
    ) {
        app = initializeApp(firebaseConfig);
    } else {
        console.error("CRITICAL: Firebase environment variables are not set. Please check your .env.local file and Vercel project settings.");
        // Provide mock/empty objects to prevent crashing, but functionality will be broken.
        app = {} as FirebaseApp;
    }
} else {
    app = getApp();
}

// These services will be properly initialized if the app was initialized.
// If not, they will be empty objects, and subsequent Firebase calls will fail,
// which is expected if the config is missing.
auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

export { app, auth, db, storage };
