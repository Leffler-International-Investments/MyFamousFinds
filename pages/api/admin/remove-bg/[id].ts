import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../../utils/adminAuth";
import { adminDb, isFirebaseAdminReady } from "../../../../utils/firebaseAdmin";
import {
  fetchImageBuffer,
  hasStorageBucket,
  storeListingImages,
} from "../../../../utils/listingImageProcessing";

export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;
  if (!isFirebaseAdminReady || !adminDb) return res.status(500).json({ ok: false, error: "Firebase Admin not initialized" });
  if (!hasStorageBucket()) return res.status(500).json({ ok: false, error: "Storage bucket not configured" });

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
    let displayImageUrl = "";

    for (const url of sourceUrls) {
      try {
        const image = await fetchImageBuffer(url);
        const stored = await storeListingImages(image, "listing-images");

        if (processedCount === 0) {
          displayImageUrl = stored.displayUrl;
        }
        processedCount++;
      } catch (err) {
        console.error(`[remove-bg] Failed to process image for ${id}:`, (err as any)?.message || err);
      }
    }

    if (displayImageUrl) {
      await docRef.set(
        { displayImageUrl, updatedAt: new Date() },
        { merge: true }
      );
    }

    return res.status(200).json({ ok: true, processedCount, displayImageUrl });
  } catch (err: any) {
    console.error("[remove-bg] Error:", err?.message || err);
    return res.status(500).json({ ok: false, error: err?.message || "Processing failed" });
  }
}
