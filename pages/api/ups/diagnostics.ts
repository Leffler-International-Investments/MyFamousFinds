// FILE: /pages/api/ups/diagnostics.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

type Check = { ok: boolean; title: string; details?: string };

function has(v?: string) {
  return typeof v === "string" && v.trim().length > 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const sellerId = await getSellerId(req);
  if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const checks: Check[] = [];

  // UPS env vars
  const upsClientId = process.env.UPS_CLIENT_ID;
  const upsClientSecret = process.env.UPS_CLIENT_SECRET;
  const upsAccount = process.env.UPS_ACCOUNT_NUMBER;
  const upsBaseUrl = process.env.UPS_BASE_URL;

  checks.push({
    ok: has(upsClientId),
    title: "UPS_CLIENT_ID present",
    details: has(upsClientId) ? "OK" : "Missing in Vercel environment variables",
  });
  checks.push({
    ok: has(upsClientSecret),
    title: "UPS_CLIENT_SECRET present",
    details: has(upsClientSecret) ? "OK" : "Missing in Vercel environment variables",
  });
  checks.push({
    ok: has(upsAccount),
    title: "UPS_ACCOUNT_NUMBER present",
    details: has(upsAccount) ? "OK" : "Missing (or empty) — UPS labels usually require this",
  });
  checks.push({
    ok: has(upsBaseUrl),
    title: "UPS_BASE_URL present",
    details: has(upsBaseUrl) ? `Value: ${upsBaseUrl}` : "Missing — should usually be https://onlinetools.ups.com",
  });

  // Firebase Admin readiness
  checks.push({
    ok: !!isFirebaseAdminReady && !!adminDb,
    title: "Firebase Admin initialized (server-side)",
    details: !!isFirebaseAdminReady && !!adminDb ? "OK" : "Firebase Admin not ready — check FIREBASE_SERVICE_ACCOUNT_JSON",
  });

  // Storage bucket presence (used to upload label)
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "";

  checks.push({
    ok: has(bucket),
    title: "Firebase Storage bucket configured",
    details: has(bucket) ? `Bucket: ${bucket}` : "Missing FIREBASE_STORAGE_BUCKET (or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)",
  });

  // Seller address presence
  let sellerAddressOk = false;
  let sellerAddressWhere = "";
  let sellerEmailGuess = "";

  if (adminDb) {
    try {
      const sellerDoc = await adminDb.collection("sellers").doc(String(sellerId)).get();
      if (sellerDoc.exists) {
        const sd: any = sellerDoc.data() || {};
        sellerEmailGuess = String(sd.contactEmail || sd.email || "").trim().toLowerCase();

        const addr = sd.address || sd.shippingAddress || null;
        if (
          addr &&
          (addr.line1 || addr.address1) &&
          addr.city &&
          (addr.state || addr.stateProvince) &&
          (addr.postalCode || addr.zip)
        ) {
          sellerAddressOk = true;
          sellerAddressWhere = "sellers/<sellerId> address block";
        }
      }

      // Prefer seller_banking doc if email is known
      if (!sellerAddressOk && sellerEmailGuess) {
        const bankDoc = await adminDb.collection("seller_banking").doc(sellerEmailGuess).get();
        if (bankDoc.exists) {
          const b: any = bankDoc.data() || {};
          if (b.addressLine1 && b.city && b.state && b.postalCode) {
            sellerAddressOk = true;
            sellerAddressWhere = "seller_banking/<sellerEmail>";
          }
        }
      }
    } catch (e: any) {
      checks.push({
        ok: false,
        title: "Firestore readable for seller address",
        details: e?.message || "Failed to read seller docs",
      });
    }
  }

  checks.push({
    ok: sellerAddressOk,
    title: "Seller ship-from address exists in Firestore",
    details: sellerAddressOk
      ? `OK (${sellerAddressWhere})`
      : `Missing — complete Seller Banking address (recommended). ${sellerEmailGuess ? `Email key used: ${sellerEmailGuess}` : ""}`,
  });

  // Summary: "production label roadmap" (what must be true)
  const mustPassTitles = [
    "UPS_CLIENT_ID present",
    "UPS_CLIENT_SECRET present",
    "UPS_ACCOUNT_NUMBER present",
    "UPS_BASE_URL present",
    "Firebase Admin initialized (server-side)",
    "Firebase Storage bucket configured",
    "Seller ship-from address exists in Firestore",
  ];

  const mustPass = checks
    .filter((c) => mustPassTitles.includes(c.title))
    .every((c) => c.ok);

  const notes: string[] = [];
  if (!mustPass) {
    notes.push("Fix FAIL items first — label generation will not work reliably until all PASS.");
  } else {
    notes.push("All required checks passed — production label flow should work.");
  }

  return res.status(200).json({
    ok: true,
    checks,
    summary: {
      readyForProductionLabel: mustPass,
      notes,
    },
  });
}
