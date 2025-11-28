// FILE: /utils/firebaseAdmin.ts

import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue as FirestoreFieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function initAdminApp() {
  // Re-use existing app if already initialised
  if (getApps().length > 0) {
    return getApp();
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!json) {
    // This is the ONLY requirement now – your original env
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing");
  }

  const serviceAccount = JSON.parse(json);

  // private_key normally already has real newlines after JSON.parse,
  // but this is harmless if they were escaped.
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return initializeApp({
    credential: cert(serviceAccount as any),
  });
}

const adminApp = initAdminApp();

// ✅ Exports used across the app
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const FieldValue = FirestoreFieldValue;
