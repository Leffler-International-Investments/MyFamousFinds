// FILE: /pages/api/admin/backfill-images.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { processImageFromUrl } from "../../../lib/imageProcessing";

export const config = {
  api: {
    bodyParser: true,
  },
  // Increase timeout for long-running backfill
  maxDuration: 300, // 5 minutes (Vercel Pro limit)
};

type ApiResponse =
  | { ok: true; processed: number; skipped: number; failed: number; errors: string[] }
  | { ok: false; error: string };

/**
 * Admin-only API endpoint to backfill displayImageUrl for existing listings
 *
 * POST body:
 * - batchSize?: number (default 10, max 50)
 * - dryRun?: boolean (if true, don't actually update documents)
 * - adminKey: string (simple auth check)
 *
 * This processes listings that have image_url/imageUrl but no displayImageUrl
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { batchSize = 10, dryRun = false, adminKey } = req.body || {};

    // Simple auth check - in production, use proper authentication
    const expectedKey = process.env.ADMIN_BACKFILL_KEY || "backfill-secret-key";
    if (adminKey !== expectedKey) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const limit = Math.min(Math.max(Number(batchSize) || 10, 1), 50);

    // Find listings that need processing
    // They have an image URL but no displayImageUrl
    const snapshot = await adminDb
      .collection("listings")
      .where("displayImageUrl", "==", null)
      .limit(limit)
      .get();

    // Also check for listings where displayImageUrl field doesn't exist
    const snapshot2 = await adminDb
      .collection("listings")
      .limit(limit * 2)
      .get();

    // Combine and dedupe, filtering to those without displayImageUrl
    const docsToProcess = new Map<string, FirebaseFirestore.DocumentSnapshot>();

    snapshot.docs.forEach((doc) => {
      docsToProcess.set(doc.id, doc);
    });

    snapshot2.docs.forEach((doc) => {
      const data = doc.data() || {};
      if (!data.displayImageUrl) {
        docsToProcess.set(doc.id, doc);
      }
    });

    // Take only up to limit
    const docs = Array.from(docsToProcess.values()).slice(0, limit);

    let processed = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    const bucket = getStorage().bucket();

    for (const doc of docs) {
      const data = doc.data() || {};
      const listingId = doc.id;

      // Get original image URL
      const originalUrl =
        data.image_url ||
        data.imageUrl ||
        data.image ||
        (Array.isArray(data.images) && data.images[0]) ||
        (Array.isArray(data.imageUrls) && data.imageUrls[0]) ||
        "";

      if (!originalUrl) {
        skipped++;
        continue;
      }

      // Skip if already has displayImageUrl
      if (data.displayImageUrl) {
        skipped++;
        continue;
      }

      try {
        console.log(`[backfill] Processing listing ${listingId}...`);

        // Process the image
        const result = await processImageFromUrl(originalUrl);

        if (!result.success || !result.processedBuffer) {
          errors.push(`${listingId}: ${result.error || "Processing failed"}`);
          failed++;
          continue;
        }

        if (dryRun) {
          console.log(`[backfill] DRY RUN: Would process ${listingId}`);
          processed++;
          continue;
        }

        // Upload to Firebase Storage
        const timestamp = Date.now();
        const processedPath = `processed-images/${listingId}-${timestamp}.jpg`;
        const file = bucket.file(processedPath);

        await file.save(result.processedBuffer, {
          metadata: {
            contentType: "image/jpeg",
            metadata: {
              listingId,
              processedAt: new Date().toISOString(),
              usedBackgroundRemoval: String(result.usedBackgroundRemoval),
            },
          },
        });

        await file.makePublic();

        const displayImageUrl = `https://storage.googleapis.com/${bucket.name}/${processedPath}`;

        // Update the listing
        await adminDb.collection("listings").doc(listingId).update({
          displayImageUrl,
          imageProcessedAt: new Date(),
        });

        console.log(`[backfill] Successfully processed ${listingId}`);
        processed++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${listingId}: ${errorMsg}`);
        failed++;
      }
    }

    return res.status(200).json({
      ok: true,
      processed,
      skipped,
      failed,
      errors: errors.slice(0, 10), // Limit error messages returned
    });
  } catch (error) {
    console.error("[backfill-images] Error:", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
