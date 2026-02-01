// FILE: /utils/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase CLIENT (browser) configuration.
 *
 * IMPORTANT:
 * - Do NOT throw at import-time if env vars are missing.
 *   Throwing here crashes the entire site with "client-side exception".
 * - Instead, export nulls and let UI/features degrade gracefully.
 *
 * Required (Vercel / .env.local):
 * NEXT_PUBLIC_FB_API_KEY
 * NEXT_PUBLIC_FB_AUTH_DOMAIN
 * NEXT_PUBLIC_FB_PROJECT_ID
 * NEXT_PUBLIC_FB_STORAGE_BUCKET
 * NEXT_PUBLIC_FB_MESSAGING_SENDER_ID
 * NEXT_PUBLIC_FB_APP_ID
 */

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
} as const;

function hasAllFirebaseClientEnv() {
  return Boolean(
    cfg.apiKey &&
      cfg.authDomain &&
      cfg.projectId &&
      cfg.storageBucket &&
      cfg.messagingSenderId &&
      cfg.appId
  );
}

export const firebaseClientReady = hasAllFirebaseClientEnv();

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (firebaseClientReady) {
  app = getApps().length ? getApp() : initializeApp(cfg as any);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[firebaseClient] Missing NEXT_PUBLIC_FB_* env vars. Firebase client features disabled."
  );
}

export { app, db, auth };
