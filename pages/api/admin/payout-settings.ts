// FILE: /pages/api/admin/payout-settings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getPayoutSettings, setPayoutSettings, PayoutMode } from "../../../lib/payoutSettings";
import { requireAdmin } from "../../../utils/authServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await requireAdmin(req);

    if (req.method === "GET") {
      const settings = await getPayoutSettings();
      return res.status(200).json({ ok: true, settings });
    }

    if (req.method === "POST") {
      const { defaultCoolingDays, payoutMode } = req.body || {};
      const mode = payoutMode as PayoutMode | undefined;

      if (mode && !["manual", "stripe_connect_auto"].includes(mode)) {
        return res.status(400).json({ ok: false, error: "invalid_payout_mode" });
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
    return res.status(401).json({ ok: false, error: e?.message || "unauthorized" });
  }
}
