// FILE: /utils/firebaseAdmin.ts
import { getApps, initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

let initialized = false;

function initFirebaseAdmin() {
  if (initialized || getApps().length) return;

  const projectId = process.env.FB_PROJECT_ID;
  const clientEmail = process.env.FB_CLIENT_EMAIL;
  let privateKey = process.env.FB_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase env vars: FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY"
    );
  }

  let serviceAccount: ServiceAccount;

  // Case 1: FB_PRIVATE_KEY contains full service-account JSON
  if (privateKey.trim().startsWith("{")) {
    serviceAccount = JSON.parse(privateKey) as ServiceAccount;
  } else {
    // Case 2: FB_PRIVATE_KEY is just the PEM string
    if (privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    serviceAccount = {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  initializeApp({
    credential: cert(serviceAccount),
  });

  initialized = true;
}

initFirebaseAdmin();

export const adminDb = getFirestore();
export { FieldValue };
