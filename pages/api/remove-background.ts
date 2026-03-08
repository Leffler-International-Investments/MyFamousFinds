import type { NextApiRequest, NextApiResponse } from "next";
import { removeBackgroundAndMakeWhite } from "../../utils/backgroundRemovalWhite";

const PHOTOROOM_API_KEY = process.env.PHOTOROOM_API_KEY || "";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const source = Buffer.concat(chunks);

    const result = await removeBackgroundAndMakeWhite(source, {
      photoRoomApiKey: PHOTOROOM_API_KEY,
      width: 800,
      height: 1067,
      quality: 90,
      timeoutMs: 30000,
    });

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("X-Background-Removed", result.backgroundRemoved ? "true" : "false");
    if (result.error) {
      res.setHeader("X-Bg-Removal-Error", result.error.substring(0, 200));
    }
    return res.status(200).send(result.buffer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      ok: false,
      error: "Background removal failed",
      detail: message,
    });
  }
}
