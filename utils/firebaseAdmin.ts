// FILE: /utils/firebaseAdmin.ts

import { cert, getApps, getApp, initializeApp, App } from "firebase-admin/app";
import { getFirestore, FieldValue as FirestoreFieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/**
 * Initialise Firebase Admin.
 *
 * Supports EITHER:
 *  1) FIREBASE_SERVICE_ACCOUNT_KEY  (full JSON string)
 *  OR
 *  2) FB_PROJECT_ID + FB_CLIENT_EMAIL + FB_PRIVATE_KEY  (split fields)
 */
function initAdminApp(): App {
  // Re-use existing app if already initialised
  if (getApps().length > 0) {
    return getApp();
  }

  let serviceAccount: any | null = null;

  // ---- OPTION 1: full JSON service account ----
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (json) {
    try {
      serviceAccount = JSON.parse(json);
    } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON", err);
    }
  }

  // ---- OPTION 2: split env vars (your original setup) ----
  if (!serviceAccount) {
    const projectId = process.env.FB_PROJECT_ID;
    const clientEmail = process.env.FB_CLIENT_EMAIL;
    let privateKey = process.env.FB_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Fix escaped newlines in the private key
      privateKey = privateKey.replace(/\\n/g, "\n");

      serviceAccount = {
        type: "service_account",
        project_id: projectId,
        client_email: clientEmail,
        private_key: privateKey,
      };
    }
  }

  // Still nothing? Then we *really* have no credentials.
  if (!serviceAccount) {
    console.error(
      "Firebase Admin credentials are not fully configured. " +
        "Provide FIREBASE_SERVICE_ACCOUNT_KEY (JSON) OR FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY."
    );
    throw new Error("Firebase Admin is not configured");
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
