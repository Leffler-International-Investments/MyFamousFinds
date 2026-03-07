import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";
import {
  fetchImageBuffer,
  hasStorageBucket,
} from "../../../../utils/listingImageProcessing";
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";
import crypto from "crypto";
import admin from "../../../../utils/firebaseAdmin";

export const config = {
  api: {
    responseLimit: false,
  },
  maxDuration: 300,
};

type ApiResponse =
  | { ok: true; displayImageUrl: string; processedCount: number }
  | { ok: false; error: string };

const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "";

function buildDownloadUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    path
  )}?alt=media&token=${token}`;
}

function pickSourceImages(data: any): string[] {
  const urls: string[] = [];

  if (Array.isArray(data?.imageUrls)) {
    for (const u of data.imageUrls) {
      if (typeof u === "string" && u.startsWith("http")) urls.push(u);
    }
  }

  if (urls.length === 0 && Array.isArray(data?.images)) {
    for (const u of data.images) {
      if (typeof u === "string" && u.startsWith("http")) urls.push(u);
    }
  }

  if (urls.length === 0) {
    const single =
      data?.imageUrl || data?.image_url || data?.image || "";
    if (typeof single === "string" && single.startsWith("http")) {
      urls.push(single);
    }
  }

  return urls;
}

async function removeAndWhiten(inputBuffer: Buffer): Promise<Buffer> {
  // 1. Remove background using @imgly/background-removal-node (runs locally, no API needed)
  const blob = await removeBackground(inputBuffer);
  const arrayBuffer = await blob.arrayBuffer();
  const transparentBuffer = Buffer.from(arrayBuffer);

  // 2. Flatten transparent background to white, resize for display
  return sharp(transparentBuffer)
    .rotate()
    .resize(800, 1067, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

async function uploadToStorage(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = admin.storage().bucket(STORAGE_BUCKET);
  const token = crypto.randomUUID();

  await bucket.file(path).save(buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
    resumable: false,
  });

  return buildDownloadUrl(STORAGE_BUCKET, path, token);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase Admin not initialized" });
  }

  if (!hasStorageBucket()) {
    return res.status(500).json({ ok: false, error: "Firebase Storage bucket not configured" });
  }

  const id = String(req.query.id || "").trim();
  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing listing id" });
  }

  try {
    const docRef = adminDb.collection("listings").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const data = docSnap.data() || {};
    const sourceUrls = pickSourceImages(data);

    if (sourceUrls.length === 0) {
      return res.status(400).json({ ok: false, error: "No images found on this listing" });
    }

    let primaryDisplayUrl = "";
    const newImageUrls: string[] = [];
    let processedCount = 0;

    for (const url of sourceUrls) {
      try {
        const image = await fetchImageBuffer(url);

        // Remove background and flatten to white
        const displayBuffer = await removeAndWhiten(image.buffer);

        const imageId = crypto.randomUUID();
        const displayPath = `listing-images/display/${imageId}.jpg`;

        const displayUrl = await uploadToStorage(displayPath, displayBuffer, "image/jpeg");
        newImageUrls.push(url); // keep original URL

        if (!primaryDisplayUrl) {
          primaryDisplayUrl = displayUrl;
        }
        processedCount++;
      } catch (err) {
        console.warn(`Failed to process image for listing ${id}:`, err);
        newImageUrls.push(url);
      }
    }

    if (!primaryDisplayUrl) {
      return res.status(500).json({ ok: false, error: "Failed to process any images" });
    }

    const updates: Record<string, any> = {
      displayImageUrl: primaryDisplayUrl,
      updatedAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date(),
    };

    await docRef.set(updates, { merge: true });

    return res.status(200).json({
      ok: true,
      displayImageUrl: primaryDisplayUrl,
      processedCount,
    });
  } catch (err: any) {
    console.error("admin remove-bg error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Background removal failed",
    });
  }
}
