import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

const REMBG_API_KEY = process.env.REMBG_API_KEY || "";

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

    let finalImage: Buffer;

    if (REMBG_API_KEY) {
      const form = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
      form.append("image", blob, "image.jpg");
      form.append("format", "png");

      const rembgRes = await fetch("https://api.rembg.com/rmbg", {
        method: "POST",
        headers: { "x-api-key": REMBG_API_KEY },
        body: form,
        signal: AbortSignal.timeout(25000),
      });

      if (!rembgRes.ok) throw new Error(`rembg API error: ${rembgRes.status}`);

      const resultBuffer = Buffer.from(await rembgRes.arrayBuffer());
      finalImage = await sharp(resultBuffer)
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 95 })
        .toBuffer();
    } else {
      finalImage = await sharp(buffer)
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 95 })
        .toBuffer();
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.send(finalImage);

  } catch (error) {
    res.status(500).json({ error: "Image processing failed" });
  }
}
