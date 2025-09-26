
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

let adminApp: admin.app.App;

export const getFirebaseAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  if (!serviceAccount) {
    throw new Error('Firebase service account key is not available. Please set the FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  }

  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  return adminApp;
};

    