// FILE: /utils/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

/**
 * Firebase CLIENT (browser) configuration.
 *
 * - Uses ONLY env vars
 * - Does NOT throw at import-time (prevents Vercel build crashes)
 * - Exports named `app` AND `firebaseClientReady` (fixes your compile error)
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

// ✅ used by pages to render a helpful message instead of crashing build
export const firebaseClientReady: boolean = hasRequired;

// ✅ IMPORTANT: named export `app` (your designers.tsx expects it)
export const app: FirebaseApp | null = hasRequired
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig as any))
  : null;

// Keep existing exports used around the codebase
export const db = app ? getFirestore(app) : (null as any);
export const auth = app ? getAuth(app) : (null as any);

// Ensure Firebase Auth sessions persist across page refreshes and browser restarts.
// Without this, some browsers default to in-memory or session-only persistence,
// causing users to lose their auth state on refresh.
if (auth && typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("[firebaseClient] Failed to set auth persistence:", err);
  });
}

// Keep default export for any pages that do: import app from ".../firebaseClient"
export default app as any;
