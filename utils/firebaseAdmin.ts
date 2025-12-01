// FILE: /utils/firebaseAdmin.ts
import admin, { ServiceAccount } from "firebase-admin";

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
let rawPrivateKey = process.env.FB_PRIVATE_KEY;
const databaseURL = process.env.FB_DATABASE_URL || undefined;

let app: admin.app.App | undefined;

if (!admin.apps.length) {
  try {
    if (projectId && clientEmail && rawPrivateKey) {
      const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

      const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        privateKey,
      };

      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        ...(databaseURL ? { databaseURL } : {}),
      });
    } else {
      console.warn(
        "Firebase Admin NOT initialized – missing FB_PROJECT_ID / FB_CLIENT_EMAIL / FB_PRIVATE_KEY"
      );
    }
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
} else {
  app = admin.app();
}

// ─────────────────────────────────────────────
// REAL vs STUB EXPORTS
// ─────────────────────────────────────────────

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;
let FieldValue: typeof admin.firestore.FieldValue;

if (app) {
  // ✅ REAL Firestore/Auth when env vars are present
  adminDb = admin.firestore();
  adminAuth = admin.auth();
  FieldValue = admin.firestore.FieldValue;
} else {
  // ✅ SAFE STUBS so build/pages don't crash when Admin isn't configured

  const makeQuery = () => {
    const query: any = {
      where: () => query,
      orderBy: () => query,
      limit: () => query,
      get: async () => ({ docs: [] }),
      doc: () => ({
        get: async () => ({ exists: false, data: () => null }),
        set: async () => {},
        update: async () => {},
        delete: async () => {},
      }),
    };
    return query;
  };

  const stubDb: any = {
    collection: () => makeQuery(),
  };

  const stubAuth: any = {
    getUser: async () => null,
    getUserByEmail: async () => null,
  };

  adminDb = stubDb;
  adminAuth = stubAuth;
  FieldValue = {
    serverTimestamp: () => new Date(),
  } as any;
}

export { adminDb, adminAuth, FieldValue };
export default admin;
