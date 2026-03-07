import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";
import {
  fetchImageBuffer,
  hasStorageBucket,
  storeListingImages,
} from "../../../../utils/listingImageProcessing";

export const config = {
  api: {
    responseLimit: false,
  },
  maxDuration: 120,
};

type ApiResponse =
  | { ok: true; displayImageUrl: string; processedCount: number }
  | { ok: false; error: string };

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
        const stored = await storeListingImages(image, "listing-images");
        newImageUrls.push(stored.originalUrl);

        if (!primaryDisplayUrl) {
          primaryDisplayUrl = stored.displayUrl;
        }
        processedCount++;
      } catch (err) {
        console.warn(`Failed to process image for listing ${id}:`, err);
        // Keep original URL as fallback
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

    if (newImageUrls.length > 0) {
      updates.imageUrl = newImageUrls[0];
      updates.imageUrls = newImageUrls;
    }

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
