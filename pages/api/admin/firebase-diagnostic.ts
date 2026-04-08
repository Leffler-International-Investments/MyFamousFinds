// FILE: /pages/api/admin/firebase-diagnostic.ts
// Diagnostic endpoint to test Firebase Admin connectivity.
// Requires ADMIN_API_SECRET header for security.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    envVarPresent: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    envVarLength: (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").length,
    envVarStartsWith: (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").substring(0, 20),
    splitEnvPresent: {
      FB_PROJECT_ID: !!process.env.FB_PROJECT_ID,
      FB_CLIENT_EMAIL: !!process.env.FB_CLIENT_EMAIL,
      FB_PRIVATE_KEY: !!(process.env.FB_PRIVATE_KEY),
    },
    isFirebaseAdminReady,
    adminDbExists: !!adminDb,
    adminAuthExists: !!adminAuth,
  };

  // Try to parse the JSON env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      checks.jsonParseOk = true;
      checks.parsedKeys = Object.keys(parsed);
      checks.projectId = parsed.project_id || "(missing)";
      checks.clientEmail = parsed.client_email ? parsed.client_email.substring(0, 30) + "..." : "(missing)";
      checks.hasPrivateKey = !!parsed.private_key;
      checks.privateKeyLength = (parsed.private_key || "").length;
    } catch (e: any) {
      checks.jsonParseOk = false;
      checks.jsonParseError = e.message;
    }
  }

  // Test Firestore connectivity
  if (adminDb) {
    try {
      // Test: read sellers collection
      const sellersSnap = await adminDb.collection("sellers").limit(5).get();
      checks.sellersCount = sellersSnap.size;
      checks.sellersEmpty = sellersSnap.empty;
      if (!sellersSnap.empty) {
        checks.sellerSampleIds = sellersSnap.docs.map((d) => d.id);
        checks.sellerSampleFields = Object.keys(sellersSnap.docs[0].data());
      }

      // Test: read listings collection
      const listingsSnap = await adminDb.collection("listings").limit(1).get();
      checks.listingsEmpty = listingsSnap.empty;

      // Test: read seller_agreements collection
      const agreementsSnap = await adminDb.collection("seller_agreements").limit(1).get();
      checks.sellerAgreementsEmpty = agreementsSnap.empty;

      // Test: read users collection
      const usersSnap = await adminDb.collection("users").limit(1).get();
      checks.usersEmpty = usersSnap.empty;

      // Count total docs in key collections
      const [allSellers, allListings, allOrders, allAgreements] = await Promise.all([
        adminDb.collection("sellers").get(),
        adminDb.collection("listings").get(),
        adminDb.collection("orders").get(),
        adminDb.collection("seller_agreements").get(),
      ]);
      checks.totalSellers = allSellers.size;
      checks.totalListings = allListings.size;
      checks.totalOrders = allOrders.size;
      checks.totalAgreements = allAgreements.size;

      checks.firestoreConnected = true;
    } catch (e: any) {
      checks.firestoreConnected = false;
      checks.firestoreError = e.message;
      checks.firestoreErrorCode = e.code;
    }
  }

  // Test Auth connectivity
  if (adminAuth) {
    try {
      const listResult = await adminAuth.listUsers(1);
      checks.authConnected = true;
      checks.authUsersExist = listResult.users.length > 0;
    } catch (e: any) {
      checks.authConnected = false;
      checks.authError = e.message;
    }
  }

  return res.status(200).json(checks);
}
