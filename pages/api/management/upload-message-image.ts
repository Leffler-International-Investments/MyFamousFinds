// FILE: /pages/api/management/upload-message-image.ts
// Handles multi-image upload for buyer messages (promo banners, etc.)

import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";
import sharp from "sharp";
import crypto from "crypto";
import admin, { isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

export const config = {
  api: {
    bodyParser: false,
  },
};

type ApiOk = { ok: true; urls: string[] };
type ApiErr = { ok: false; error: string };

const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "";

function parseForm(req: NextApiRequest) {
  const form = formidable({
    multiples: true,
    maxFileSize: 10 * 1024 * 1024, // 10 MB per file
    maxFiles: 6,
  });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    }
  );
}

function getBucket() {
  if (!isFirebaseAdminReady || !STORAGE_BUCKET) return null;
  return admin.storage().bucket(STORAGE_BUCKET);
}

function buildDownloadUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    path
  )}?alt=media&token=${token}`;
}

async function uploadBuffer(buffer: Buffer, contentType: string): Promise<string> {
  const bucket = getBucket();
  const id = crypto.randomUUID();
  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `message-images/${id}.${ext}`;

  if (bucket && STORAGE_BUCKET) {
    const token = crypto.randomUUID();
    await bucket.file(path).save(buffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: token },
      },
      resumable: false,
    });
    return buildDownloadUrl(STORAGE_BUCKET, path, token);
  }

  // Fallback: base64 data URL (works without Storage bucket)
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { files } = await parseForm(req);
    const raw = files.images || files.image || files.file || [];
    const fileList = Array.isArray(raw) ? raw : [raw];

    if (fileList.length === 0) {
      return res.status(400).json({ ok: false, error: "No images provided" });
    }

    const urls: string[] = [];

    for (const file of fileList) {
      if (!file || !file.filepath) continue;
      const buffer = await fs.readFile(file.filepath);

      // Resize to reasonable dimensions for promo images
      const processed = await sharp(buffer)
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();

      const url = await uploadBuffer(processed, "image/jpeg");
      urls.push(url);
    }

    return res.status(200).json({ ok: true, urls });
  } catch (error: any) {
    console.error("Message image upload error:", error);
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Upload failed" });
  }
}
