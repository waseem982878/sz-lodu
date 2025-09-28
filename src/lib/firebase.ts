
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

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

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} catch (error) {
    console.error("CRITICAL: Firebase initialization failed.", error);
    // In case of failure, provide non-functional stubs to prevent app crash
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    storage = {} as FirebaseStorage;
}

export { app, auth, db, storage };
