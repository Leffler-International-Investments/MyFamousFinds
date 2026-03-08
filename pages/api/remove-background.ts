import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const chunks: Uint8Array[] = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // White-background display image (no bg removal — removed @imgly/background-removal-node)
    const resultBuffer = await sharp(buffer)
      .rotate()
      .resize(800, 1067, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.send(resultBuffer);

  } catch (error) {
    console.error("[remove-background] Handler error:", (error as any)?.message || error);
    res.status(500).json({ error: "Image processing failed", detail: (error as any)?.message });
  }
}
