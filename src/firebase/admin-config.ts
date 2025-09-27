import * as admin from 'firebase-admin';

// This function safely initializes the Firebase Admin SDK.
// It ensures that it's only initialized once (singleton pattern).
export const getFirebaseAdminApp = () => {
  // If the app is already initialized, return it.
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  // Check if the service account key is available in environment variables.
  // This is crucial for security.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('Firebase service account key is not available. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set in your environment variables.');
  }

  // Initialize the app with credentials.
  const app = admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  return app;
};

    