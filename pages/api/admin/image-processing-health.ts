import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/adminAuth";
import { getImageProcessingStatus } from "../../../utils/listingImageProcessing";

export const config = { maxDuration: 30 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  const status = getImageProcessingStatus();
  const rembgConfigured = Boolean(process.env.REMBG_API_KEY);

  return res.status(200).json({ ok: true, ...status, rembgConfigured, uploadMaxDuration: 300 });
}
