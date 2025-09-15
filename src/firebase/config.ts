
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyATZDqpzbFDaDz0JmR-uOneFbLklNmfPZ8",
  authDomain: "ludo-king-battles.firebaseapp.com",
  databaseURL: "https://ludo-king-battles-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ludo-king-battles",
  storageBucket: "ludo-king-battles.appspot.com",
  messagingSenderId: "211677946988",
  appId: "1:211677946988:web:d1a505fbdbd88f5368a449",
  measurementId: "G-J2B17ENJ9N"
};


// Initialize Firebase for SSR
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

