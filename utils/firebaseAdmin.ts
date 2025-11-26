// FILE: /utils/firebaseAdmin.ts
import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
const rawPrivateKey = process.env.FB_PRIVATE_KEY;

// Handle multiline private key stored with \n
const privateKey =
  rawPrivateKey && rawPrivateKey.includes("\\n")
    ? rawPrivateKey.replace(/\\n/g, "\n")
    : rawPrivateKey || undefined;

let app: App | null = null;

try {
  if (!getApps().length && projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else if (getApps().length) {
    app = getApps()[0]!;
  } else {
    console.warn("Firebase Admin disabled: missing FB_* env vars");
  }
} catch (err) {
  // 🔥 Catch decoder / OpenSSL errors so they don't crash API routes
  console.error("Firebase Admin init failed, running without admin:", err);
  app = null;
}

export const adminDb = app ? getFirestore(app) : null;
export const adminAuth = app ? getAuth(app) : null;
export { FieldValue };
