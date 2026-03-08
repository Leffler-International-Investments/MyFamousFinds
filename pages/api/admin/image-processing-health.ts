import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/adminAuth";
import { getImageProcessingStatus, isPhotoroomConfigured } from "../../../utils/listingImageProcessing";
import { removeBackgroundAndMakeWhite } from "../../../utils/backgroundRemovalWhite";
import sharp from "sharp";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  const status = getImageProcessingStatus();
  const photoroomKey = process.env.PHOTOROOM_API_KEY || "";
  const configured = isPhotoroomConfigured();

  const result: Record<string, unknown> = {
    ok: true,
    ...status,
    photoroomConfigured: configured,
    photoroomKeyPrefix: photoroomKey ? photoroomKey.substring(0, 8) + "..." : "(empty)",
    photoroomKeyLength: photoroomKey.length,
    bgRemoval: configured ? "photoroom" : "disabled",
  };

  // Live test: generate a tiny 10x10 red image and send it through Photoroom
  if (configured && req.query.test === "1") {
    try {
      const testImage = await sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } },
      })
        .jpeg()
        .toBuffer();

      const start = Date.now();
      const output = await removeBackgroundAndMakeWhite(testImage, {
        photoRoomApiKey: photoroomKey,
        width: 10,
        height: 10,
        quality: 50,
        timeoutMs: 15000,
      });
      const elapsed = Date.now() - start;

      result.liveTest = {
        status: "ok",
        elapsedMs: elapsed,
        inputBytes: testImage.byteLength,
        outputBytes: output.byteLength,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      result.liveTest = {
        status: "failed",
        error: message,
      };
    }
  }

  return res.status(200).json(result);
}
