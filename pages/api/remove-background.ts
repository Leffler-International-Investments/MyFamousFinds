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
      console.log("[rembg] Starting bg removal, key length:", REMBG_API_KEY.length);
      const form = new FormData();
      const file = new File([new Uint8Array(buffer)], "image.jpg", { type: "image/jpeg" });
      form.append("image", file);
      form.append("format", "png");
      form.append("bg_color", "#ffffffff");

      const rembgRes = await fetch("https://api.rembg.com/rmbg", {
        method: "POST",
        headers: { "x-api-key": REMBG_API_KEY },
        body: form,
        signal: AbortSignal.timeout(30000),
      });

      if (!rembgRes.ok) {
        const errText = await rembgRes.text();
        throw new Error(`rembg API error: ${rembgRes.status} ${rembgRes.statusText} - ${errText}`);
      }
      console.log("[rembg] Success");

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
    console.error("[rembg] Handler error:", (error as any)?.message || error);
    res.status(500).json({ error: "Image processing failed", detail: (error as any)?.message });
  }
}
