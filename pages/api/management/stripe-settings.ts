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

const STRIPE_SETTINGS_DOC = adminDb
  .collection("admin")
  .doc("stripe_settings");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StripeSettingsResponse>
) {
  // GET SETTINGS
  if (req.method === "GET") {
    try {
      const snap = await STRIPE_SETTINGS_DOC.get();

      if (!snap.exists) {
        return res.status(200).json({ ok: true, settings: null });
      }

      const data = snap.data() as StripeSettings;

      return res.status(200).json({
        ok: true,
        settings: {
          publishableKey: data.publishableKey || "",
          secretKey: data.secretKey || "",
          platformCommission: Number(data.platformCommission) || 0,
          minPayout: Number(data.minPayout) || 0,
          testMode: Boolean(data.testMode),
        },
      });
    } catch (err) {
      console.error("stripe_settings_get_error", err);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  // SAVE SETTINGS
  if (req.method === "POST") {
    try {
      const {
        publishableKey,
        secretKey,
        platformCommission,
        minPayout,
        testMode,
      } = req.body as Partial<StripeSettings>;

      if (!publishableKey || !secretKey) {
        return res.status(400).json({
          ok: false,
          error: "missing_keys",
        });
      }

      const commissionNumber = Number(platformCommission ?? 0);
      const minPayoutNumber = Number(minPayout ?? 0);

      if (Number.isNaN(commissionNumber) || Number.isNaN(minPayoutNumber)) {
        return res.status(400).json({
          ok: false,
          error: "invalid_number_fields",
        });
      }

      await STRIPE_SETTINGS_DOC.set(
        {
          publishableKey,
          secretKey,
          platformCommission: commissionNumber,
          minPayout: minPayoutNumber,
          testMode: Boolean(testMode),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("stripe_settings_post_error", err);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  // Unsupported method
  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
