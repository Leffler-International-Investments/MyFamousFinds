// FILE: /utils/firebaseClient.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Firebase CLIENT (browser) configuration.
 *
 * - Uses ONLY environment variables
 * - NO hardcoded keys
 * - NO throw at import-time (prevents Vercel/SSR build crashes)
 *
 * REQUIRED env vars (Vercel):
 * NEXT_PUBLIC_FIREBASE_API_KEY
 * NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * NEXT_PUBLIC_FIREBASE_APP_ID
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasRequired =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId;

// ✅ Used by pages to avoid crashing when env vars are not configured.
export const firebaseClientReady: boolean = hasRequired;

// NOTE: exported as non-null (with any fallback) to avoid TypeScript breakage across the codebase.
// Pages that run in environments without env vars should check `firebaseClientReady` first.
const app = hasRequired
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig as any))
  : (null as any);

export const db = hasRequired ? getFirestore(app) : (null as any);
export const auth = hasRequired ? getAuth(app) : (null as any);

export default app;
