// FILE: /utils/firebaseAdmin.ts

import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue as FirestoreFieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function initAdminApp() {
  // Re-use existing app if already initialised
  if (getApps().length > 0) {
    return getApp();
  }

  let projectId: string | undefined;
  let clientEmail: string | undefined;
  let privateKey: string | undefined;

  // 1) OLD STYLE: single JSON env (your original setup)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      projectId = parsed.project_id;
      clientEmail = parsed.client_email;
      privateKey = parsed.private_key;
    } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", err);
    }
  }

  // 2) NEW STYLE: split envs (optional fallback)
  if (!projectId) projectId = process.env.FB_PROJECT_ID;
  if (!clientEmail) clientEmail = process.env.FB_CLIENT_EMAIL;
  if (!privateKey) privateKey = process.env.FB_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are not fully configured. Provide FIREBASE_SERVICE_ACCOUNT_KEY (JSON) OR FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY."
    );
  }

  // Fix escaped newlines if coming from env
  privateKey = privateKey.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const adminApp = initAdminApp();

// ✅ Exports used across the app
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const FieldValue = FirestoreFieldValue;
