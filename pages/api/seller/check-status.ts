// FILE: /pages/api/seller/check-status.ts
// Server-side seller status check — mirrors the vetting-queue normalization
// so the account page always reflects the same approval status.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { getAuthUser } from "../../../utils/authServer";

type StatusResponse =
  | {
      status: "none" | "pending" | "approved" | "rejected";
      sellerId?: string;
    }
  | { error: string };

function normalizeStatus(data: Record<string, any>): "approved" | "pending" | "rejected" {
  const raw = String(data.status || "").trim().toLowerCase();

  // Check both status field AND legacy verified flag (backward compatibility)
  if (raw === "approved" || raw === "active" || data.verified === true) return "approved";
  if (raw === "pending") return "pending";
  if (raw === "rejected" || raw === "disabled") return "rejected";

  // Default: treat unknown statuses as pending
  return "pending";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  const user = await getAuthUser(req);
  if (!user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const email = user.email.trim().toLowerCase();
  const underscoreId = email.replace(/\./g, "_");

  try {
    // ---------- 4-way lookup (same logic as vetting-queue + account page) ----------

    let sellerSnap: any = null;

    // 1) Doc ID = raw email (profile/onboard/login path)
    const byRawEmail = await adminDb.collection("sellers").doc(email).get();
    if (byRawEmail.exists) sellerSnap = byRawEmail;

    // 2) Doc ID = underscore format (apply path: email.replace(/\./g, "_"))
    if (!sellerSnap && underscoreId !== email) {
      const byUnderscore = await adminDb.collection("sellers").doc(underscoreId).get();
      if (byUnderscore.exists) sellerSnap = byUnderscore;
    }

    // 3) Query by email field
    if (!sellerSnap) {
      const byEmailField = await adminDb
        .collection("sellers")
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!byEmailField.empty) sellerSnap = byEmailField.docs[0];
    }

    // 4) Query by contactEmail field
    if (!sellerSnap) {
      const byContactEmail = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", email)
        .limit(1)
        .get();
      if (!byContactEmail.empty) sellerSnap = byContactEmail.docs[0];
    }

    // ---------- Not found ----------
    if (!sellerSnap) {
      return res.status(200).json({ status: "none" });
    }

    const data = sellerSnap.data() || {};
    const status = normalizeStatus(data);

    // ---------- Migration: write back normalized status for legacy sellers ----------
    // If the seller was approved via the old verified flag but never got a proper
    // status field, persist "Approved" so every lookup path agrees.
    if (
      status === "approved" &&
      data.verified === true &&
      String(data.status || "").trim().toLowerCase() !== "approved"
    ) {
      try {
        await sellerSnap.ref.update({ status: "Approved" });
        console.log(
          `[CHECK-STATUS] Migrated seller ${sellerSnap.id}: verified:true → status:Approved`
        );
      } catch (migrationErr) {
        // Non-fatal — status was already correctly resolved for this request
        console.warn("[CHECK-STATUS] migration write failed:", migrationErr);
      }
    }

    return res.status(200).json({ status, sellerId: sellerSnap.id });
  } catch (err: any) {
    console.error("[CHECK-STATUS] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
