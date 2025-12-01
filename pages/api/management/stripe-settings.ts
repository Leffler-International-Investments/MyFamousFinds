// FILE: /pages/api/management/stripe-settings.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

const DOC_REF = adminDb.collection("admin").doc("stripe_settings");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const snap = await DOC_REF.get();

      if (!snap.exists) {
        console.error("🔥 Firestore: stripe_settings NOT FOUND");
        return res.status(200).json({
          ok: false,
          error: "no_settings",
        });
      }

      const data = snap.data();
      console.log("🔥 Stripe settings loaded:", data);

      return res.status(200).json({ ok: true, settings: data });
    }

    if (req.method === "POST") {
      const { publishableKey, secretKey, platformCommission, minPayout, testMode } =
        req.body;

      if (!publishableKey || !secretKey) {
        return res.status(400).json({
          ok: false,
          error: "missing_keys",
        });
      }

      await DOC_REF.set(
        {
          publishableKey,
          secretKey,
          platformCommission: Number(platformCommission) || 15,
          minPayout: Number(minPayout) || 50,
          testMode: !!testMode,
        },
        { merge: true }
      );

      console.log("🔥 Stripe settings saved.");

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  } catch (err) {
    console.error("🔥 API ERROR:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
