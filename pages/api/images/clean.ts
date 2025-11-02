// FILE: pages/api/images/clean.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "node:stream";
import sharp from "sharp";
import { request } from "undici";
import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

const PROVIDER = process.env.NEXT_PUBLIC_BG_PROVIDER || "removebg";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

export const config = { api: { bodyParser: true } };

async function removeBgWithRemoveBg(imageUrl: string): Promise<Buffer> {
  const apiKey = process.env.REMOVEBG_API_KEY!;
  if (!apiKey) throw new Error("Missing REMOVEBG_API_KEY");
  const formBody = new URLSearchParams();
  formBody.set("image_url", imageUrl);
  formBody.set("size", "auto");         // keep original size
  formBody.set("format", "png");        // transparent PNG
  const resp = await request("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody.toString(),
  });
  if (resp.statusCode !== 200) {
    const text = await resp.body.text();
    throw new Error(`remove.bg failed: ${resp.statusCode} ${text}`);
  }
  return Buffer.from(await resp.body.arrayBuffer());
}

async function removeBgWithCloudinary(imageUrl: string): Promise<Buffer> {
  // Cloudinary background removal (requires the add-on)
  // We fetch a transparent PNG result via `e_bgremoval` transformation.
  const publicId = `tmp_${crypto.randomUUID()}`;
  // Use auto-upload by remote fetch
  const uploaded = await cloudinary.uploader.upload(imageUrl, {
    public_id: publicId,
    overwrite: true,
  });

  const transformedUrl = cloudinary.url(uploaded.public_id, {
    transformation: [{ effect: "bgremoval" }], // e_bgremoval
    format: "png",
    secure: true,
  });

  const resp = await request(transformedUrl);
  if (resp.statusCode !== 200) {
    const text = await resp.body.text();
    throw new Error(`Cloudinary fetch failed: ${resp.statusCode} ${text}`);
  }
  return Buffer.from(await resp.body.arrayBuffer());
}

async function compositeOnWhite(transPng: Buffer): Promise<Buffer> {
  const img = sharp(transPng);
  const { width, height } = await img.metadata();

  const w = width || 1200;
  const h = height || 1200;

  const whiteBg = await sharp({
    create: { width: w, height: h, channels: 3, background: "#ffffff" },
  })
    .png()
    .toBuffer();

  // Center the subject on white canvas
  return await sharp(whiteBg)
    .composite([{ input: transPng, gravity: "center" }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    const { imageUrl } = req.body || {};
    if (!imageUrl || typeof imageUrl !== "string") return res.status(400).json({ ok: false, error: "imageUrl required" });

    const cutout =
      PROVIDER === "cloudinary"
        ? await removeBgWithCloudinary(imageUrl)
        : await removeBgWithRemoveBg(imageUrl);

    const cleaned = await compositeOnWhite(cutout);

    const dataUrl = `data:image/jpeg;base64,${cleaned.toString("base64")}`;
    return res.status(200).json({ ok: true, cleanedDataUrl: dataUrl });
  } catch (err: any) {
    console.error("clean error", err);
    return res.status(500).json({ ok: false, error: err.message || "clean_failed" });
  }
}
