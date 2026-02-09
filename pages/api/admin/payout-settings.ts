// FILE: /pages/api/admin/payout-settings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getPayoutSettings,
  setPayoutSettings,
  PayoutMode,
} from "../../../lib/payoutSettings";
import { requireAdmin } from "../../../utils/adminAuth";

type Data =
  | { ok: true; settings: any }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === "GET") {
      const settings = await getPayoutSettings();
      return res.status(200).json({ ok: true, settings });
    }

    if (req.method === "POST") {
      const { defaultCoolingDays, payoutMode } = req.body || {};
      const mode = payoutMode as PayoutMode | undefined;

      if (mode && !["manual", "stripe_connect_auto"].includes(mode)) {
        return res
          .status(400)
          .json({ ok: false, error: "invalid_payout_mode" });
      }

      const next = await setPayoutSettings({
        defaultCoolingDays:
          typeof defaultCoolingDays === "number" ? defaultCoolingDays : undefined,
        payoutMode: mode,
      });

      return res.status(200).json({ ok: true, settings: next });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  } catch (e: any) {
    console.error("payout_settings_error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "internal_error" });
  }
}
