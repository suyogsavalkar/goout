// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only on client side
let app;
if (typeof window !== 'undefined') {
  app = initializeApp(firebaseConfig);
}

// Initialize Firebase services only on client side
export const auth = typeof window !== 'undefined' && app ? getAuth(app) : null;
export const googleProvider = typeof window !== 'undefined' ? new GoogleAuthProvider() : null;

// Initialize Firestore
export const db = typeof window !== 'undefined' && app ? getFirestore(app) : null;

// Initialize Firebase Storage
export const storage = typeof window !== 'undefined' && app ? getStorage(app) : null;

// Configure Google provider (only on client side)
if (typeof window !== 'undefined' && googleProvider) {
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}

// Firestore offline support
export const enableFirestoreNetwork = () => db ? enableNetwork(db) : Promise.resolve();
export const disableFirestoreNetwork = () => db ? disableNetwork(db) : Promise.resolve();

export default app;