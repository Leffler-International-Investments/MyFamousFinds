// FILE: utils/firebaseAdmin.ts
import admin, { ServiceAccount } from "firebase-admin";

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
const rawPrivateKey = process.env.FB_PRIVATE_KEY;
const databaseURL = process.env.FB_DATABASE_URL || undefined;

if (!projectId || !clientEmail || !rawPrivateKey) {
  throw new Error(
    "Missing Firebase Admin variables. Required: FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY"
  );
}

// In Vercel the key is stored as one line with literal \n – convert to real newlines:
const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    } as ServiceAccount),
    ...(databaseURL ? { databaseURL } : {}),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;

export default admin;
