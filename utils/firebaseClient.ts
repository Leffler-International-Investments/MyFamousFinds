// FILE: /utils/firebaseClient.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDddxs7XqxDhkfzvFxZigUQlZJu0fZ7VJQ",
  authDomain: "famous-finds.firebaseapp.com",
  projectId: "famous-finds",
  storageBucket: "famous-finds.firebasestorage.app",
  messagingSenderId: "825808501537",
  appId: "1:825808501537:web:a0516661171712bd2c9c60",
  measurementId: "G-NHM648X2ZR",
};

// Make sure we only ever create one Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

// --- IMPORTANT PART ---
// Only initialise Storage in the browser.
// On the server (during `next build` / page-data collection) we *don't*
// call getStorage(), which avoids "Service storage is not available".
let storageInstance: FirebaseStorage | null = null;

if (typeof window !== "undefined") {
  storageInstance = getStorage(app);
}

// Keep the old `storage` export name so all existing imports keep working.
// In the browser this is a real FirebaseStorage; on the server it's just
// a no-op placeholder and won't be used.
export const storage = storageInstance as unknown as FirebaseStorage;

export default app;
