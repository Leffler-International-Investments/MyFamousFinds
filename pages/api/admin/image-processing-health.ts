import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import { requireAdmin } from "../../../utils/adminAuth";
import { getImageProcessingStatus } from "../../../utils/listingImageProcessing";

export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  const status = getImageProcessingStatus();

  // If ?test=bg-removal, actually run background removal on a tiny test image
  if (req.query.test === "bg-removal" || req.query.test === "photoroom") {
    try {
      // Create a tiny 10x10 red square
      const testBuffer = await sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } },
      })
        .png()
        .toBuffer();

      const { removeBackground } = await import("@imgly/background-removal-node");
      const inputBlob = new Blob([new Uint8Array(testBuffer)], { type: "image/png" });
      const resultBlob = await removeBackground(inputBlob, {
        model: "medium",
        output: { format: "image/png" },
      });
      const bytes = (await resultBlob.arrayBuffer()).byteLength;

      return res.status(200).json({
        ok: true,
        bgRemovalTest: "SUCCESS",
        engine: "@imgly/background-removal-node",
        responseBytes: bytes,
      });
    } catch (err: any) {
      return res.status(200).json({
        ok: false,
        bgRemovalTest: "ERROR",
        engine: "@imgly/background-removal-node",
        error: err?.message || String(err),
      });
    }
  }

  return res.status(200).json({
    ok: true,
    ...status,
    bgRemovalEngine: "@imgly/background-removal-node",
    hint: "Add ?test=bg-removal to actually test background removal",
  });
}
