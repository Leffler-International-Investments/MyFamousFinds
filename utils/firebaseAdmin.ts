// FILE: /utils/firebaseAdmin.ts
import admin, { ServiceAccount } from "firebase-admin";

/**
 * Supports BOTH credential styles:
 *
 * (A) Single env var JSON (your current working setup):
 *   FIREBASE_SERVICE_ACCOUNT_JSON = { ...full service account json... }
 *
 * (B) Split env vars (optional fallback):
 *   FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY, (optional) FB_DATABASE_URL
 *
 * IMPORTANT:
 * - Keeping the full JSON "page" in Vercel is OK.
 * - This parses it correctly whether Vercel stores it multi-line or single-line.
 */

const databaseURL = process.env.FB_DATABASE_URL || undefined;

function parseServiceAccountFromJsonEnv(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);

    // Normalize common encoding where private_key includes literal \n
    if (obj.private_key && typeof obj.private_key === "string") {
      obj.private_key = obj.private_key.replace(/\\n/g, "\n");
    }

    return obj as ServiceAccount;
  } catch (e) {
    console.error("FIREBASE_SERVICE_ACCOUNT_JSON parse error:", e);
    return null;
  }
}

function parseServiceAccountFromSplitEnv(): ServiceAccount | null {
  const projectId = process.env.FB_PROJECT_ID;
  const clientEmail = process.env.FB_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FB_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) return null;

  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

  return {
    projectId,
    clientEmail,
    privateKey,
  } as ServiceAccount;
}

let app: admin.app.App | undefined;

if (!admin.apps.length) {
  try {
    // Prefer the single JSON env var (your current setup)
    const sa =
      parseServiceAccountFromJsonEnv() || parseServiceAccountFromSplitEnv();

    if (!sa) {
      console.warn(
        "Firebase Admin NOT initialized – missing FIREBASE_SERVICE_ACCOUNT_JSON or FB_PROJECT_ID/FB_CLIENT_EMAIL/FB_PRIVATE_KEY"
      );
    } else {
      app = admin.initializeApp({
        credential: admin.credential.cert(sa),
        ...(databaseURL ? { databaseURL } : {}),
      });
    }
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
} else {
  app = admin.app();
}

export const isFirebaseAdminReady = !!app;

export const adminDb: admin.firestore.Firestore | null = app
  ? admin.firestore()
  : null;

export const adminAuth: admin.auth.Auth | null = app ? admin.auth() : null;

export const FieldValue = app
  ? admin.firestore.FieldValue
  : ({
      serverTimestamp: () => new Date(),
    } as any);

export default admin;
