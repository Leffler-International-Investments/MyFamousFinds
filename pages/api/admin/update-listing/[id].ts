// FILE: /pages/api/admin/update-listing/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

const ALLOWED_STATUSES = new Set(["Live", "Pending", "Rejected", "Sold"]);
const ALLOWED_CONDITIONS = new Set([
  "New with tags",
  "New (never used)",
  "Excellent",
  "Very good",
  "Good",
  "Fair",
]);

type ApiResponse =
  | { ok: true }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  try {
    if (!isFirebaseAdminReady || !adminDb) {
      return res.status(500).json({
        ok: false,
        error:
          "Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON (or FB_PROJECT_ID/FB_CLIENT_EMAIL/FB_PRIVATE_KEY) in Vercel env vars.",
      });
    }

    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ ok: false, error: "Missing listing id" });

    const { price, condition, status, details } = req.body || {};
    const updates: Record<string, any> = {
      updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
    };

    if (price !== undefined) {
      const parsed = typeof price === "number" ? price : Number(String(price));
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ ok: false, error: "Invalid price" });
      }
      updates.price = parsed;
      updates.priceUsd = parsed;
    }

    if (condition !== undefined) {
      const nextCondition = String(condition || "").trim();
      if (!nextCondition || !ALLOWED_CONDITIONS.has(nextCondition)) {
        return res.status(400).json({
          ok: false,
          error:
            "Invalid condition. Use: New with tags, New (never used), Excellent, Very good, Good, Fair",
        });
      }
      updates.condition = nextCondition;
    }

    if (status !== undefined) {
      const nextStatus = String(status || "").trim();
      if (!nextStatus || !ALLOWED_STATUSES.has(nextStatus)) {
        return res.status(400).json({
          ok: false,
          error: "Invalid status. Use: Live, Pending, Rejected, Sold",
        });
      }
      updates.status = nextStatus;
      if (nextStatus === "Sold") {
        updates.soldAt = FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date();
        updates.isSold = true;
      }
    }

    if (details !== undefined) {
      updates.details = String(details || "").trim();
    }

    const hasUpdates = Object.keys(updates).length > 1;
    if (!hasUpdates) {
      return res.status(400).json({ ok: false, error: "No updates provided" });
    }

    await adminDb.collection("listings").doc(id).set(updates, { merge: true });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("admin update-listing error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Internal error",
    });
  }
}
