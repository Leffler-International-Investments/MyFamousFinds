import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/adminAuth";
import { getImageProcessingStatus } from "../../../utils/listingImageProcessing";

export const config = { maxDuration: 30 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  const status = getImageProcessingStatus();

  let imglyOk = false;
  let imglyError = "";
  try {
    const { removeBackground } = await import("@imgly/background-removal-node");
    imglyOk = typeof removeBackground === "function";
  } catch (e: any) {
    imglyError = e?.message || "unknown error";
  }

  return res.status(200).json({ ok: true, ...status, imglyLoaded: imglyOk, imglyError: imglyError || null, uploadMaxDuration: 60 });
}
