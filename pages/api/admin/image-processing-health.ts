import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/adminAuth";
import { getImageProcessingStatus, isPhotoroomConfigured } from "../../../utils/listingImageProcessing";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  const status = getImageProcessingStatus();

  return res.status(200).json({
    ok: true,
    ...status,
    photoroomConfigured: isPhotoroomConfigured(),
    bgRemoval: isPhotoroomConfigured() ? "photoroom" : "disabled",
  });
}
