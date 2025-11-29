// FILE: /utils/firebaseAdmin.ts
import admin, { ServiceAccount } from "firebase-admin";

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
let rawPrivateKey = process.env.FB_PRIVATE_KEY;
const databaseURL = process.env.FB_DATABASE_URL || undefined;

// 1. Check for missing keys (Safety check)
if (!projectId || !clientEmail || !rawPrivateKey) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "⚠️ Missing Firebase Admin variables in .env.local (FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY)"
    );
  }
}

// 2. Format Private Key (Handle Vercel's newline formatting)
if (rawPrivateKey) {
  // Remove wrapping quotes if they exist
  if (rawPrivateKey.startsWith('"') && rawPrivateKey.endsWith('"')) {
    rawPrivateKey = rawPrivateKey.slice(1, -1);
  }
  // Convert escaped \n to real newlines
  rawPrivateKey = rawPrivateKey.replace(/\\n/g, "\n");
}

const serviceAccount: ServiceAccount = {
  projectId,
  clientEmail,
  privateKey: rawPrivateKey,
};

// 3. Initialize App (Singleton pattern)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(databaseURL ? { databaseURL } : {}),
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

// 4. Export services for use in API routes
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;

export default admin;
