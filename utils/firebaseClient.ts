// FILE: /utils/firebaseClient.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDddxs7XqxDhkfzvFxZigUQlZJu0fZ7VJQ",
  authDomain: "famous-finds.firebaseapp.com",
  projectId: "famous-finds",
  storageBucket: "famous-finds.firebasestorage.app",
  messagingSenderId: "825808501537",
  appId: "1:825808501537:web:a0516661171712bd2c9c60",
  measurementId: "G-NHM648X2ZR",
};

// Initialize app once (works on server + client)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore + Auth are safe on both server and client
export const db = getFirestore(app);
export const auth = getAuth(app);

// ---- Storage: browser-only to avoid "Service storage is not available" ----
let storage: FirebaseStorage;

// Next.js will execute this module on the server while building pages.
// Firebase Storage is not available there, so we only call getStorage in
// a real browser environment.
if (typeof window !== "undefined") {
  storage = getStorage(app);
} else {
  // Dummy placeholder so code that *imports* `storage` during SSR
  // doesn't crash the build. You should only actually use Storage
  // in client-side code (components, hooks, etc.).
  storage = {} as FirebaseStorage;
}

export { app, storage };
export default app;
