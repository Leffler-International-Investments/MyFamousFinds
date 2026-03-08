import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../utils/adminAuth";
import { adminDb, isFirebaseAdminReady } from "../../../../utils/firebaseAdmin";
import {
  fetchImageBuffer,
  hasStorageBucket,
  storeListingImages,
  isPhotoroomConfigured,
} from "../../../../utils/listingImageProcessing";

export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;
  if (!isFirebaseAdminReady || !adminDb) return res.status(500).json({ ok: false, error: "Firebase Admin not initialized" });
  if (!hasStorageBucket()) return res.status(500).json({ ok: false, error: "Storage bucket not configured" });
  if (!isPhotoroomConfigured()) return res.status(500).json({ ok: false, error: "PHOTOROOM_API_KEY is not configured — background removal is unavailable" });

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ ok: false, error: "Missing listing id" });

  try {
    const docRef = adminDb.collection("listings").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: "Listing not found" });

    const data: any = snap.data() || {};
    const sourceUrls: string[] = [];

    // Collect all image URLs from the listing
    if (data.imageUrl) sourceUrls.push(data.imageUrl);
    if (Array.isArray(data.imageUrls)) {
      for (const u of data.imageUrls) {
        if (typeof u === "string" && u && !sourceUrls.includes(u)) sourceUrls.push(u);
      }
    }

    if (sourceUrls.length === 0) {
      return res.status(400).json({ ok: false, error: "No source images found on listing" });
    }

    let processedCount = 0;
    let failedCount = 0;
    let bgRemovedCount = 0;
    let bgSkippedCount = 0;
    const errors: string[] = [];
    let displayImageUrl = "";

    for (const url of sourceUrls) {
      try {
        const image = await fetchImageBuffer(url);
        const stored = await storeListingImages(image, "listing-images");

        if (processedCount === 0) {
          displayImageUrl = stored.displayUrl;
        }
        processedCount++;

        if (stored.backgroundRemoved) {
          bgRemovedCount++;
        } else {
          bgSkippedCount++;
          if (stored.bgRemovalError) {
            errors.push(`BG removal skipped: ${stored.bgRemovalError}`);
            console.warn(`[remove-bg] BG removal skipped for listing ${id}:`, stored.bgRemovalError);
          }
        }
      } catch (err) {
        failedCount++;
        const msg = (err as any)?.message || String(err);
        errors.push(msg);
        console.error(`[remove-bg] Failed to process image for listing ${id}:`, msg);
      }
    }

    if (processedCount === 0) {
      return res.status(500).json({
        ok: false,
        error: `All ${sourceUrls.length} image(s) failed to process`,
        errors,
      });
    }

    // Report partial success: images were stored but bg removal may have been skipped
    const allBgFailed = bgRemovedCount === 0 && processedCount > 0;

    if (displayImageUrl) {
      await docRef.set(
        { displayImageUrl, updatedAt: new Date() },
        { merge: true }
      );
    }

    return res.status(200).json({
      ok: !allBgFailed,
      processedCount,
      failedCount,
      bgRemovedCount,
      bgSkippedCount,
      displayImageUrl,
      ...(allBgFailed ? { error: "Images stored but background removal failed for all" } : {}),
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (err: any) {
    console.error(`[remove-bg] Error for listing ${id}:`, err?.message || err);
    return res.status(500).json({ ok: false, error: err?.message || "Processing failed" });
  }
}
