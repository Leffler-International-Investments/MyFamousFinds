// FILE: /pages/api/admin/banking.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

type Ok = { ok: true; prefs?: any };
type Err = { error: string };
type Data = Ok | Err;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (!requireAdmin(req, res)) return;

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  const emailParam =
    (req.method === "GET"
      ? req.query.email
      : (req.body && req.body.email)) || "";

  const email =
    typeof emailParam === "string" ? emailParam.toLowerCase() : "";

  if (!email) {
    return res.status(400).json({ error: "Missing admin email" });
  }

  const docRef = adminDb.collection("managementPayoutPrefs").doc(email);

  try {
    if (req.method === "GET") {
      const snap = await docRef.get();
      if (!snap.exists) {
        return res.status(200).json({ ok: true, prefs: null });
      }
      return res.status(200).json({ ok: true, prefs: snap.data() });
    }

    if (req.method === "POST") {
      const { legalName, roleTitle, amountUsd, frequency, startDate, notes } =
        req.body || {};

      await docRef.set(
        {
          email,
          legalName: legalName || "",
          roleTitle: roleTitle || "",
          amountUsd:
            typeof amountUsd === "number" && !Number.isNaN(amountUsd)
              ? amountUsd
              : null,
          frequency: frequency || "Monthly",
          startDate: startDate || "",
          notes: notes || "",
          updatedAt: new Date(),
        },
        { merge: true }
      );

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("admin_banking_error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal server error" });
  }
}
