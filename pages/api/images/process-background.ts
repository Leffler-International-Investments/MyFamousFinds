// FILE: /pages/api/images/process-background.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { processImageFromUrl, processImageWithWhiteBackground } from "../../../lib/imageProcessing";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { initializeApp, getApps, cert } from "firebase-admin/app";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

type ApiResponse =
  | { ok: true; displayImageUrl: string; usedBackgroundRemoval: boolean }
  | { ok: false; error: string };

/**
 * API endpoint to process an image with white background
 *
 * POST body:
 * - imageUrl: string (Firebase Storage URL of original image)
 * - listingId?: string (optional - if provided, updates the listing document)
 *
 * Returns:
 * - displayImageUrl: string (URL of processed image in Firebase Storage)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { imageUrl, listingId, base64Image } = req.body || {};

    if (!imageUrl && !base64Image) {
      return res.status(400).json({ ok: false, error: "imageUrl or base64Image required" });
    }

    let processedBuffer: Buffer | undefined;
    let usedBackgroundRemoval = false;

    if (base64Image) {
      // Process from base64
      const match = base64Image.match(/^data:image\/([a-zA-Z]*);base64,([^"]*)/);
      const rawBase64 = match ? match[2] : base64Image;
      const buffer = Buffer.from(rawBase64, "base64");

      const result = await processImageWithWhiteBackground(buffer);
      if (!result.success || !result.processedBuffer) {
        return res.status(500).json({ ok: false, error: result.error || "Processing failed" });
      }
      processedBuffer = result.processedBuffer;
      usedBackgroundRemoval = result.usedBackgroundRemoval;
    } else {
      // Process from URL
      const result = await processImageFromUrl(imageUrl);
      if (!result.success || !result.processedBuffer) {
        return res.status(500).json({ ok: false, error: result.error || "Processing failed" });
      }
      processedBuffer = result.processedBuffer;
      usedBackgroundRemoval = result.usedBackgroundRemoval;
    }

    // Upload processed image to Firebase Storage
    const bucket = getStorage().bucket();
    const timestamp = Date.now();
    const processedPath = `processed-images/${timestamp}-processed.jpg`;

    const file = bucket.file(processedPath);
    await file.save(processedBuffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          processedAt: new Date().toISOString(),
          usedBackgroundRemoval: String(usedBackgroundRemoval),
        },
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const displayImageUrl = `https://storage.googleapis.com/${bucket.name}/${processedPath}`;

    // If listingId provided, update the listing document
    if (listingId) {
      await adminDb.collection("listings").doc(listingId).update({
        displayImageUrl,
        imageProcessedAt: new Date(),
      });
    }

    return res.status(200).json({
      ok: true,
      displayImageUrl,
      usedBackgroundRemoval,
    });
  } catch (error) {
    console.error("[process-background] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
