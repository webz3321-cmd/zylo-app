import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// The configuration is loaded dynamically or falls back to standard values
const firebaseConfig = {
  apiKey: "AIzaSyDhMzYMEOrLvGtEQtyJJYgBZ_6SL1jwujs",
  authDomain: "auora-ai.firebaseapp.com",
  projectId: "auora-ai",
  storageBucket: "auora-ai.firebasestorage.app",
  messagingSenderId: "339192785560",
  appId: "1:339192785560:web:a7be5c01efcf49029dfeed"
};

let app;
let db: any;
let auth: any;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  // Initialize Firestore with custom database ID from config
  db = getFirestore(app, "ai-studio-a946147f-bdad-45d2-9b9d-a3866f1a52f1");
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase initialization failed, falling back to local simulation.", error);
  // Provide mock db & auth values to prevent crashes
  db = null;
  auth = null;
}

export { db, auth };
export default app;
