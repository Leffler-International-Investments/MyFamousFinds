// FILE: /utils/firebaseAdmin.ts
import admin, { ServiceAccount } from "firebase-admin";

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
let rawPrivateKey = process.env.FB_PRIVATE_KEY;
const databaseURL = process.env.FB_DATABASE_URL || undefined;

if (!projectId || !clientEmail || !rawPrivateKey) {
  throw new Error(
    "Missing Firebase Admin variables. Required: FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY"
  );
}

// Handle both formats: with "\n" or real newlines
if (rawPrivateKey.includes("\\n")) {
  rawPrivateKey = rawPrivateKey.replace(/\\n/g, "\n");
}

const serviceAccount: ServiceAccount = {
  projectId,
  clientEmail,
  privateKey: rawPrivateKey,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(databaseURL ? { databaseURL } : {}),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;

export default admin;
