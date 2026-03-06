// FILE: /pages/api/images/clean.ts
// Simple image fetch + normalize using sharp (no Cloudinary, no undici).
import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false
  }
};

// Only allow fetching images from trusted domains (prevent SSRF)
const ALLOWED_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "images.unsplash.com",
  "cdn.shopify.com",
  "lh3.googleusercontent.com",
];

function isAllowedUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_HOSTS.some(
      (h) => parsed.hostname === h || parsed.hostname.endsWith("." + h)
    );
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = (req.query.url as string) || "";
    if (!url) {
      res.status(400).json({ ok: false, error: "Missing ?url=" });
      return;
    }

    if (!isAllowedUrl(url)) {
      res.status(403).json({ ok: false, error: "URL domain not allowed" });
      return;
    }

    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) {
      res.status(502).json({ ok: false, error: `Fetch failed: ${r.status}` });
      return;
    }
    const arrBuf = await r.arrayBuffer();
    const input = Buffer.from(arrBuf);

    const out = await sharp(input)
      .rotate()
      .resize(800, 1067, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      // sharp@0.33 expects an object, not a number:
      .trim({ threshold: 10 })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.status(200).send(out);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
