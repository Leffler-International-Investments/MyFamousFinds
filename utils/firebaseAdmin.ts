// FILE: /utils/firebaseAdmin.ts
// Centralized Firebase Admin SDK initializer — stable for Vercel + Firestore.

import * as admin from "firebase-admin";

let app: admin.app.App;

if (!admin.apps.length) {
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FB_PROJECT_ID,
        clientEmail: process.env.FB_CLIENT_EMAIL,
        // Important: Replace escaped '\n' with real newlines
        privateKey: (process.env.FB_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.FB_DATABASE_URL,
      projectId: process.env.FB_PROJECT_ID,
    });

    console.log("✅ Firebase Admin initialized:", process.env.FB_PROJECT_ID);
  } catch (error) {
    console.error("🔥 Firebase Admin init error:", error);
  }
} else {
  app = admin.app();
}

// Export database and helper references
export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
export const adminStorage = admin.storage(app);
export { admin };
