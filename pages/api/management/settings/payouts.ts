// FILE: /pages/api/management/settings/payouts.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../../utils/firebaseAdmin";
import { getPayoutSettings } from "../../../../lib/payoutSettings";

type OkGet = { ok: true; settings: { defaultCoolingDays: number } };
type OkPost = { ok: true };
type Err = { ok: false; error: string };

// Minimal admin gate: optional shared secret.
function isAdminRequest(req: NextApiRequest) {
  const required = process.env.ADMIN_API_SECRET;
  if (!required) return false;
  const got = String(req.headers["x-admin-secret"] || "");
  return got && got === required;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkGet | OkPost | Err>
) {
  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }

  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  if (req.method === "GET") {
    const settings = await getPayoutSettings();
    return res.status(200).json({ ok: true, settings });
  }

  if (req.method === "POST") {
    const { defaultCoolingDays } = (req.body || {}) as {
      defaultCoolingDays?: number;
    };
    const n = Number(defaultCoolingDays);
    if (!Number.isFinite(n) || n < 0 || n > 60) {
      return res.status(400).json({ ok: false, error: "invalid_defaultCoolingDays" });
    }

    await adminDb
      .collection("settings")
      .doc("payouts")
      .set(
        {
          defaultCoolingDays: Math.round(n),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
