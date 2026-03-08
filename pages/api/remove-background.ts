import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

const PHOTOROOM_API_KEY = process.env.PHOTOROOM_API_KEY || "";

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

    if (PHOTOROOM_API_KEY) {
      console.log("[photoroom] Starting bg removal, key length:", PHOTOROOM_API_KEY.length);
      const form = new FormData();
      const file = new File([new Uint8Array(buffer)], "image.jpg", { type: "image/jpeg" });
      form.append("image_file", file);
      form.append("size", "auto");
      form.append("format", "png");
      form.append("bg_color", "#ffffffff");

      const photoroomRes = await fetch("https://sdk.photoroom.com/v1/segment", {
        method: "POST",
        headers: { "x-api-key": PHOTOROOM_API_KEY },
        body: form,
        signal: AbortSignal.timeout(30000),
      });

      if (!photoroomRes.ok) {
        const errText = await photoroomRes.text();
        throw new Error(`Photoroom API error: ${photoroomRes.status} ${photoroomRes.statusText} - ${errText}`);
      }
      console.log("[photoroom] Success");

      const resultBuffer = Buffer.from(await photoroomRes.arrayBuffer());
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
    console.error("[photoroom] Handler error:", (error as any)?.message || error);
    res.status(500).json({ error: "Image processing failed", detail: (error as any)?.message });
  }
}
