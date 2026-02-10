// FILE: /pages/api/admin/backfill-display-images.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import {
  fetchImageBuffer,
  hasStorageBucket,
  storeListingImages,
} from "../../../utils/listingImageProcessing";

// Env var:
// - ADMIN_ACTION_KEY: required secret for admin-only actions like backfills.
const ADMIN_ACTION_KEY = process.env.ADMIN_ACTION_KEY || "";

type ApiOk = {
  ok: true;
  updated: number;
  skipped: number;
  scanned: number;
};

type ApiErr = { ok: false; error: string };

function getAuthKey(req: NextApiRequest) {
  const headerKey = req.headers["x-admin-key"];
  if (typeof headerKey === "string" && headerKey.trim()) return headerKey.trim();
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7).trim();
  const queryKey = typeof req.query.key === "string" ? req.query.key : "";
  return queryKey.trim();
}

function pickSourceImage(data: any): string {
  return (
    data?.imageUrl ||
    data?.image_url ||
    data?.image ||
    (Array.isArray(data?.imageUrls) && data.imageUrls[0]) ||
    (Array.isArray(data?.images) && data.images[0]) ||
    ""
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!ADMIN_ACTION_KEY) {
    return res.status(500).json({
      ok: false,
      error: "ADMIN_ACTION_KEY is not configured",
    });
  }

  const authKey = getAuthKey(req);
  if (!authKey || authKey !== ADMIN_ACTION_KEY) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({
      ok: false,
      error: "Firebase Admin not initialized",
    });
  }

  if (!hasStorageBucket()) {
    return res.status(500).json({
      ok: false,
      error: "Firebase Storage bucket not configured",
    });
  }

  const max = Math.min(Math.max(Number(req.query.max || 50), 1), 200);

  try {
    const snap = await adminDb.collection("listings").limit(max).get();

    let updated = 0;
    let skipped = 0;

    for (const doc of snap.docs) {
      const data: any = doc.data() || {};

      if (data.displayImageUrl || data.display_image_url) {
        skipped++;
        continue;
      }

      const sourceUrl = pickSourceImage(data);
      if (!sourceUrl) {
        skipped++;
        continue;
      }

      try {
        const image = await fetchImageBuffer(sourceUrl);
        const stored = await storeListingImages(image, "listing-images");

        await doc.ref.set(
          {
            imageUrl: data.imageUrl || data.image_url || stored.originalUrl,
            displayImageUrl: stored.displayUrl,
            updatedAt: new Date(),
          },
          { merge: true }
        );

        updated++;
      } catch (error) {
        console.warn(`Backfill failed for listing ${doc.id}:`, error);
        skipped++;
      }
    }

    return res.status(200).json({
      ok: true,
      updated,
      skipped,
      scanned: snap.size,
    });
  } catch (error: any) {
    console.error("Backfill error:", error);
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Backfill failed" });
  }
}
