import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
const rawPrivateKey = process.env.FB_PRIVATE_KEY;

// Handle multiline private key
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, "\n") : undefined;

let app: App | undefined = undefined;

if (!getApps().length && projectId && clientEmail && privateKey) {
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
} else if (getApps().length) {
  app = getApps()[0]!;
} else {
  // ❗ Important: do NOT throw here – just warn so build doesn’t fail
  console.warn("Firebase Admin disabled: missing FB_* env vars");
}

export const adminDb = app ? getFirestore(app) : null;
