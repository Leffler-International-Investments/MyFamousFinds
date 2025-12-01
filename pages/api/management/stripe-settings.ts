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

// Firestore doc for admin Stripe settings
const STRIPE_SETTINGS_DOC = adminDb
  .collection("admin")
  .doc("stripe_settings");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StripeSettingsResponse>
) {
  // ─────────────────────────────────────────────
  // GET  → read current Stripe settings
  // ─────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const snap = await STRIPE_SETTINGS_DOC.get();

      if (!snap.exists) {
        // No settings saved yet
        return res.status(200).json({
          ok: true,
          settings: null,
        });
      }

      const data = snap.data() || {};

      const settings: StripeSettings = {
        publishableKey: String(data.publishableKey || ""),
        secretKey: String(data.secretKey || ""),
        platformCommission: Number(data.platformCommission || 0),
        minPayout: Number(data.minPayout || 0),
        testMode: Boolean(data.testMode),
      };

      return res.status(200).json({
        ok: true,
        settings,
      });
    } catch (err) {
      console.error("stripe_settings_get_error", err);
      return res
        .status(500)
        .json({ ok: false, error: "server_error" });
    }
  }

  // ─────────────────────────────────────────────
  // POST → save Stripe settings
  // ─────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const {
        publishableKey = "",
        secretKey = "",
        platformCommission = 0,
        minPayout = 0,
        testMode = false,
      } = req.body || {};

      const settings: StripeSettings = {
        publishableKey: String(publishableKey || ""),
        secretKey: String(secretKey || ""),
        platformCommission: Number(platformCommission || 0),
        minPayout: Number(minPayout || 0),
        testMode: Boolean(testMode),
      };

      await STRIPE_SETTINGS_DOC.set(settings, { merge: true });

      // ✅ FIX: always return an object that matches StripeSettingsResponse
      return res.status(200).json({
        ok: true,
        settings,
      });
    } catch (err) {
      console.error("stripe_settings_post_error", err);
      return res
        .status(500)
        .json({ ok: false, error: "server_error" });
    }
  }

  // ─────────────────────────────────────────────
  // Unsupported method
  // ─────────────────────────────────────────────
  return res
    .status(405)
    .json({ ok: false, error: "method_not_allowed" });
}
