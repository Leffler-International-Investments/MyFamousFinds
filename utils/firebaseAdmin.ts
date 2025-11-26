// utils/firebaseAdmin.ts

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
const rawPrivateKey = process.env.FB_PRIVATE_KEY;

// Handle multiline private key stored with \n
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, "\n") : undefined;

let app: App | undefined;

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
  // Do NOT throw – avoids breaking build if envs missing
  console.warn("Firebase Admin disabled: missing FB_* env vars");
}

export const adminDb = app ? getFirestore(app) : null;
export const adminAuth = app ? getAuth(app) : null;
export { FieldValue };
