// FILE: /pages/api/images/clean.ts
// Stable for Next.js 14 + Sharp v0.33 + Node 18–22 on Vercel.

import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

/** Download the remote image into a buffer (built-in fetch works on Vercel). */
async function fetchBuffer(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch failed: ${r.status} ${r.statusText}`);
  return Buffer.from(await r.arrayBuffer());
}

/** API route: /api/images/clean?url=<imageUrl>&format=webp|png */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const src =
      (req.method === "POST" ? (req.body?.url as string) : (req.query?.url as string)) || "";
    const format =
      ((req.method === "POST" ? req.body?.format : req.query?.format) as string) || "webp";

    if (!src) {
      res.status(400).json({ ok: false, error: "Missing ?url=<image_url>" });
      return;
    }

    const input = await fetchBuffer(src);

    const output = await sharp(input)
      .rotate()
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .trim({ threshold: 10 }) // ✅ correct Sharp syntax
      .toFormat(format === "png" ? "png" : "webp")
      .toBuffer();

    res.setHeader("Content-Type", format === "png" ? "image/png" : "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.status(200).send(output);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "image-clean-failed" });
  }
}
