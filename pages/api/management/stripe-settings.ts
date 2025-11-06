// FILE: /pages/api/management/stripe-settings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type StripeSettings = {
  publishableKey: string;
  secretKey: string;
  platformCommission: number;
  minPayout: number;
  testMode: boolean;
};

type StripeSettingsResponse =
  | { ok: true; settings: StripeSettings | null }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StripeSettingsResponse | { ok: boolean; error?: string }>
) {
  const docRef = adminDb.collection("config").doc("stripe");

  if (req.method === "GET") {
    try {
      const snap = await docRef.get();
      if (!snap.exists) {
        return res.status(200).json({ ok: true, settings: null });
      }
      const data = snap.data() || {};

      const settings: StripeSettings = {
        publishableKey: String(data.publishableKey || ""),
        secretKey: String(data.secretKey || ""),
        platformCommission: Number(data.platformCommission || 0),
        minPayout: Number(data.minPayout || 0),
        testMode: Boolean(data.testMode),
      };

      return res.status(200).json({ ok: true, settings });
    } catch (err) {
      console.error("stripe_settings_get_error", err);
      return res
        .status(500)
        .json({ ok: false, error: "server_error" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};

      const settings: StripeSettings = {
        publishableKey: String(body.publishableKey || "").trim(),
        secretKey: String(body.secretKey || "").trim(),
        platformCommission: Number(body.platformCommission || 0),
        minPayout: Number(body.minPayout || 0),
        testMode: Boolean(body.testMode),
      };

      await docRef.set(
        {
          ...settings,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Your admin form only checks res.ok / status, it doesn't need the body
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("stripe_settings_post_error", err);
      return res
        .status(500)
        .json({ ok: false, error: "server_error" });
    }
  }

  return res
    .status(405)
    .json({ ok: false, error: "method_not_allowed" });
}
