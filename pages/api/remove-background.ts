import type { NextApiRequest, NextApiResponse } from "next";
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const chunks: Uint8Array[] = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // remove background
    const removed = await removeBackground(buffer);

    // convert transparent background to white
    const finalImage = await sharp(Buffer.from(removed))
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 95 })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.send(finalImage);

  } catch (error) {
    res.status(500).json({ error: "Image processing failed" });
  }
}
