
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNjLtoLY0FtETH1E6BPs2x_rH3s12p0Ws",
  authDomain: "sz-ludo-34b26.firebaseapp.com",
  projectId: "sz-ludo-34b26",
  storageBucket: "sz-ludo-34b26.appspot.com",
  messagingSenderId: "508216168091",
  appId: "1:508216168091:web:f4c65e9a170c4f28cfc03e",
  measurementId: "G-YP1G7KT0F0"
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
