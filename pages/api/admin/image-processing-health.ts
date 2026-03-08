import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import { requireAdmin } from "../../../utils/adminAuth";
import { getImageProcessingStatus } from "../../../utils/listingImageProcessing";

export const config = { maxDuration: 30 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  const status = getImageProcessingStatus();
  const rembgKey = process.env.REMBG_API_KEY || "";
  const rembgConfigured = Boolean(rembgKey);

  // If ?test=rembg, actually call the API with a tiny test image
  if (req.query.test === "rembg") {
    if (!rembgKey) {
      return res.status(200).json({ ok: false, error: "REMBG_API_KEY not set" });
    }

    try {
      // Create a tiny 10x10 red square
      const testBuffer = await sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } },
      })
        .jpeg()
        .toBuffer();

      const form = new FormData();
      const file = new File([new Uint8Array(testBuffer)], "test.jpg", { type: "image/jpeg" });
      form.append("image", file);
      form.append("format", "png");

      const rembgRes = await fetch("https://api.rembg.com/rmbg", {
        method: "POST",
        headers: { "x-api-key": rembgKey },
        body: form,
        signal: AbortSignal.timeout(15000),
      });

      if (rembgRes.ok) {
        const bytes = (await rembgRes.arrayBuffer()).byteLength;
        return res.status(200).json({
          ok: true,
          rembgTest: "SUCCESS",
          responseBytes: bytes,
          keyLength: rembgKey.length,
          keyPrefix: rembgKey.substring(0, 5) + "...",
        });
      } else {
        const errText = await rembgRes.text();
        return res.status(200).json({
          ok: false,
          rembgTest: "FAILED",
          httpStatus: rembgRes.status,
          httpStatusText: rembgRes.statusText,
          errorBody: errText,
          keyLength: rembgKey.length,
          keyPrefix: rembgKey.substring(0, 5) + "...",
        });
      }
    } catch (err: any) {
      return res.status(200).json({
        ok: false,
        rembgTest: "ERROR",
        error: err?.message || String(err),
        keyLength: rembgKey.length,
        keyPrefix: rembgKey.substring(0, 5) + "...",
      });
    }
  }

  return res.status(200).json({
    ok: true,
    ...status,
    rembgConfigured,
    rembgKeyLength: rembgKey.length,
    rembgKeyPrefix: rembgKey ? rembgKey.substring(0, 5) + "..." : "(not set)",
    uploadMaxDuration: 300,
    hint: "Add ?test=rembg to actually test the rembg API",
  });
}
