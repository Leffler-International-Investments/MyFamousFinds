import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

const PHOTOROOM_API_KEY = process.env.PHOTOROOM_API_KEY || "";

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

    let finalImage: Buffer;

    if (PHOTOROOM_API_KEY) {
      console.log("[photoroom] Starting bg removal, image size:", buffer.byteLength);
      const blob = new Blob([buffer], { type: "image/jpeg" });
      const form = new FormData();
      form.append("image_file", blob, "image.jpg");
      form.append("size", "medium");
      form.append("format", "png");

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

      const resultBuffer = Buffer.from(await photoroomRes.arrayBuffer());
      console.log("[photoroom] Success, received", resultBuffer.byteLength, "bytes");
      finalImage = resultBuffer;
    } else {
      // Fallback: white background, no bg removal
      finalImage = await sharp(buffer)
        .rotate()
        .resize(800, 1067, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    }

    const contentType = PHOTOROOM_API_KEY ? "image/png" : "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.send(finalImage);

  } catch (error) {
    console.error("[remove-background] Handler error:", (error as any)?.message || error);
    res.status(500).json({ error: "Image processing failed", detail: (error as any)?.message });
  }
}
