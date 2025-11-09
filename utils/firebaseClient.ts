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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// ✅ prevent “Service storage is not available” during build
let storage: FirebaseStorage;
if (typeof window !== "undefined") {
  storage = getStorage(app);
} else {
  storage = {} as FirebaseStorage;
}

export { app, storage };
export default app;

