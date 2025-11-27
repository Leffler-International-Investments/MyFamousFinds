// FILE: utils/firebaseAdmin.ts
import admin from "firebase-admin";

// Read admin env vars
const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
const rawPrivateKey = process.env.FB_PRIVATE_KEY;
const databaseURL = process.env.FB_DATABASE_URL;

// Validate presence
if (!projectId || !clientEmail || !rawPrivateKey) {
  throw new Error(
    "❌ Missing Firebase Admin variables. Required: FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY"
  );
}

// Convert escaped newline to real newline
const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

// Initialize Firebase Admin ONE TIME only
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL,
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

export default admin;
