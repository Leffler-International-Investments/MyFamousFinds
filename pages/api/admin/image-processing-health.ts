import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/adminAuth";
import { getImageProcessingStatus, isPhotoroomConfigured } from "../../../utils/listingImageProcessing";
import { removeBackgroundAndMakeWhite } from "../../../utils/backgroundRemovalWhite";
import sharp from "sharp";

export const config = { maxDuration: 30 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  const status = getImageProcessingStatus();
  const photoroomKey = process.env.PHOTOROOM_API_KEY || "";
  const configured = isPhotoroomConfigured();
  const shouldRunTest = String(req.query.test || "") === "1";

  const result: Record<string, unknown> = {
    ok: true,
    ...status,
    uploadMaxDuration: 300,
    photoroomConfigured: configured,
    photoroomKeyPrefix: photoroomKey ? photoroomKey.substring(0, 12) + "..." : "(empty)",
    photoroomKeyLength: photoroomKey.length,
    bgRemoval: {
      preferredProvider: configured ? "photoroom" : "none",
      notes: configured
        ? "PHOTOROOM_API_KEY present."
        : "PHOTOROOM_API_KEY is not set; background removal is disabled.",
    },
  };

  // Live test: generate a tiny 10x10 red image and send it through Photoroom
  if (shouldRunTest) {
    if (!configured) {
      result.liveTest = {
        status: "failed",
        detail: "PHOTOROOM_API_KEY is missing — cannot run live test",
        durationMs: 0,
      };
    } else {
      const started = Date.now();
      try {
        const testImage = await sharp({
          create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } },
        })
          .jpeg()
          .toBuffer();

        const output = await removeBackgroundAndMakeWhite(testImage, {
          photoRoomApiKey: photoroomKey,
          width: 10,
          height: 10,
          quality: 50,
          timeoutMs: 15000,
        });

        result.liveTest = {
          status: output.backgroundRemoved ? "ok" : "bg_removal_skipped",
          durationMs: Date.now() - started,
          backgroundRemoved: output.backgroundRemoved,
          inputBytes: testImage.byteLength,
          outputBytes: output.buffer.byteLength,
          ...(output.error ? { detail: output.error } : {}),
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        result.liveTest = {
          status: "failed",
          durationMs: Date.now() - started,
          detail: message,
        };
      }
    }
  }

  return res.status(200).json(result);
}
