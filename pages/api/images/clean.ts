// FILE: /pages/api/images/clean.ts
// Cleans uploaded item backgrounds to pure white using Sharp + Cloudinary

import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "node:stream";
import { request } from "undici";
import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

// ✅ Vercel runtime + body limit setup
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};
export const runtime = "nodejs";

// ✅ Ensure Sharp is loaded properly at runtime
let sharpModule: any;
async function getSharp() {
  if (!sharpModule) {
    sharpModule = (await import("sharp")).default;
  }
  return sharpModule;
}

// ✅ Cloudinary credentials (from your .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "Missing imageUrl" });
    }

    // Fetch the image
    const response = await request(imageUrl);
    const buffer = Buffer.from(await response.body.arrayBuffer());

    // Use sharp to clean background
    const sharp = await getSharp();
    const cleaned = await sharp(buffer)
      .flatten({ background: "#ffffff" }) // white background
      .jpeg({ quality: 90 })
      .toBuffer();

    // Generate a unique filename
    const publicId = `famousfinds/${crypto.randomBytes(8).toString("hex")}`;

    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload_stream(
      { public_id: publicId, folder: "famousfinds", overwrite: true },
      (err, result) => {
        if (err) {
          console.error("Cloudinary upload failed:", err);
          return res.status(500).json({ error: "Upload failed" });
        }
        res.status(200).json({
          ok: true,
          cleanedUrl: result?.secure_url,
        });
      }
    );

    // Pipe the cleaned image into Cloudinary upload stream
    Readable.from(cleaned).pipe(uploaded);
  } catch (err: any) {
    console.error("Clean API error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
