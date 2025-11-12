// FILE: /utils/firebaseAdmin.ts
import * as admin from "firebase-admin";

let app: admin.app.App;

if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: (process.env.FB_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FB_DATABASE_URL,
    projectId: process.env.FB_PROJECT_ID,
  });
  console.log("✅ Firebase Admin initialized:", process.env.FB_PROJECT_ID);
} else {
  app = admin.app();
}

export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
export const adminStorage = admin.storage(app);
export { admin };

// ✅ Compatibility shim so existing imports keep working
export const FieldValue = admin.firestore.FieldValue;
