// FILE: /utils/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// Read env var from either naming scheme
function env(a: string, b: string) {
  return (process.env[a] || process.env[b] || "").trim();
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

function hasAll() {
  return Boolean(
    cfg.apiKey &&
      cfg.authDomain &&
      cfg.projectId &&
      cfg.storageBucket &&
      cfg.messagingSenderId &&
      cfg.appId
  );
}

export let firebaseClientReady = hasAll();

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (firebaseClientReady) {
  try {
    app = getApps().length ? getApp() : initializeApp(cfg as any);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    firebaseClientReady = false;
    app = null;
    db = null;
    auth = null;
    console.error("[firebaseClient] Firebase init failed. Client disabled.", err);
  }
} else {
  console.warn(
    "[firebaseClient] Missing Firebase NEXT_PUBLIC env vars (FB_* or FIREBASE_*). Client disabled."
  );
}

export { app, db, auth };
