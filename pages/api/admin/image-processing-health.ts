import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import { requireAdmin } from "../../../utils/adminAuth";
import { getImageProcessingStatus } from "../../../utils/listingImageProcessing";

export const config = { maxDuration: 30 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  const status = getImageProcessingStatus();
  const photoroomKey = process.env.PHOTOROOM_API_KEY || "";
  const photoroomConfigured = Boolean(photoroomKey);

  // If ?test=photoroom, actually call the API with a tiny test image
  if (req.query.test === "photoroom") {
    if (!photoroomKey) {
      return res.status(200).json({ ok: false, error: "PHOTOROOM_API_KEY not set" });
    }

    try {
      // Create a tiny 10x10 red square
      const testBuffer = await sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } },
      })
        .jpeg()
        .toBuffer();

      const form = new FormData();
      const blob = new Blob([testBuffer], { type: "image/jpeg" });
      form.append("image_file", blob, "test.jpg");
      form.append("size", "preview");
      form.append("format", "png");

      const photoroomRes = await fetch("https://sdk.photoroom.com/v1/segment", {
        method: "POST",
        headers: { "x-api-key": photoroomKey },
        body: form,
        signal: AbortSignal.timeout(15000),
      });

      if (photoroomRes.ok) {
        const bytes = (await photoroomRes.arrayBuffer()).byteLength;
        return res.status(200).json({
          ok: true,
          photoroomTest: "SUCCESS",
          responseBytes: bytes,
          keyLength: photoroomKey.length,
          keyPrefix: photoroomKey.substring(0, 5) + "...",
        });
      } else {
        const errText = await photoroomRes.text();
        return res.status(200).json({
          ok: false,
          photoroomTest: "FAILED",
          httpStatus: photoroomRes.status,
          httpStatusText: photoroomRes.statusText,
          errorBody: errText,
          keyLength: photoroomKey.length,
          keyPrefix: photoroomKey.substring(0, 5) + "...",
        });
      }
    } catch (err: any) {
      return res.status(200).json({
        ok: false,
        photoroomTest: "ERROR",
        error: err?.message || String(err),
        keyLength: photoroomKey.length,
        keyPrefix: photoroomKey.substring(0, 5) + "...",
      });
    }
  }

  return res.status(200).json({
    ok: true,
    ...status,
    photoroomConfigured,
    photoroomKeyLength: photoroomKey.length,
    photoroomKeyPrefix: photoroomKey ? photoroomKey.substring(0, 5) + "..." : "(not set)",
    uploadMaxDuration: 300,
    hint: "Add ?test=photoroom to actually test the Photoroom API",
  });
}
