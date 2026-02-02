// FILE: /utils/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase CLIENT (browser) configuration.
 *
 * Supports BOTH env naming schemes:
 * - NEXT_PUBLIC_FB_*
 * - NEXT_PUBLIC_FIREBASE_*
 */

function env(nameA: string, nameB: string) {
  return process.env[nameA] || process.env[nameB] || "";
}

const cfg = {
  apiKey: env("NEXT_PUBLIC_FB_API_KEY", "NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: env("NEXT_PUBLIC_FB_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: env("NEXT_PUBLIC_FB_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: env("NEXT_PUBLIC_FB_STORAGE_BUCKET", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: env(
    "NEXT_PUBLIC_FB_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  ),
  appId: env("NEXT_PUBLIC_FB_APP_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"),
} as const;

function missingKeys() {
  const out: string[] = [];
  if (!cfg.apiKey) out.push("API_KEY");
  if (!cfg.authDomain) out.push("AUTH_DOMAIN");
  if (!cfg.projectId) out.push("PROJECT_ID");
  if (!cfg.storageBucket) out.push("STORAGE_BUCKET");
  if (!cfg.messagingSenderId) out.push("MESSAGING_SENDER_ID");
  if (!cfg.appId) out.push("APP_ID");
  return out;
}

export const firebaseClientMissing = missingKeys();
export const firebaseClientReady = firebaseClientMissing.length === 0;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (firebaseClientReady) {
  app = getApps().length ? getApp() : initializeApp(cfg as any);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  // Show exactly what is missing (helps you verify Vercel env scope)
  // eslint-disable-next-line no-console
  console.warn(
    `[firebaseClient] Missing env vars: ${firebaseClientMissing.join(
      ", "
    )}. Firebase client disabled.`
  );
}

export { app, db, auth };
