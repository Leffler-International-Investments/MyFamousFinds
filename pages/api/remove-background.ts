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
      console.log("[photoroom] Starting bg removal, key prefix:", PHOTOROOM_API_KEY.substring(0, 8) + "..., length:", PHOTOROOM_API_KEY.length, ", image size:", buffer.byteLength);
      const blob = new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
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

      // Return the transparent PNG directly so the caller can see the removal
      finalImage = resultBuffer;
    } else {
      finalImage = await sharp(buffer)
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 95 })
        .toBuffer();
    }

    // If Photoroom was used, result is PNG with transparency; otherwise JPEG
    const contentType = PHOTOROOM_API_KEY ? "image/png" : "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.send(finalImage);

  } catch (error) {
    console.error("[photoroom] Handler error:", (error as any)?.message || error);
    res.status(500).json({ error: "Image processing failed", detail: (error as any)?.message });
  }
}
