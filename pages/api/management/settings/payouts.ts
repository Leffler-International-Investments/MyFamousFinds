// FILE: /pages/api/management/settings/payouts.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import {
  getPayoutSettings,
  setPayoutSettings,
  PayoutMode,
} from "../../../../lib/payoutSettings";

type OkGet = { ok: true; settings: { defaultCoolingDays: number; payoutMode: PayoutMode } };
type OkPost = { ok: true; settings: { defaultCoolingDays: number; payoutMode: PayoutMode } };
type Err = { ok: false; error: string };

// Minimal admin gate: optional shared secret.
function isAdminRequest(req: NextApiRequest) {
  const required = process.env.ADMIN_API_SECRET;
  if (!required) return true;
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
    const { defaultCoolingDays, payoutMode } = (req.body || {}) as {
      defaultCoolingDays?: number;
      payoutMode?: string;
    };

    if (defaultCoolingDays !== undefined) {
      const n = Number(defaultCoolingDays);
      if (!Number.isFinite(n) || n < 0 || n > 60) {
        return res.status(400).json({ ok: false, error: "invalid_defaultCoolingDays" });
      }
    }

    if (payoutMode !== undefined && !["manual", "stripe_connect_auto"].includes(payoutMode)) {
      return res.status(400).json({ ok: false, error: "invalid_payoutMode" });
    }

    const next = await setPayoutSettings({
      defaultCoolingDays:
        typeof defaultCoolingDays === "number" ? defaultCoolingDays : undefined,
      payoutMode: payoutMode as PayoutMode | undefined,
    });

    return res.status(200).json({ ok: true, settings: next });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
