import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { fetchImageBuffer, hasStorageBucket, storeListingImages } from "../../../utils/listingImageProcessing";

const ADMIN_ACTION_KEY = process.env.ADMIN_ACTION_KEY || "";

type ApiOk = {
  ok: true;
  updated: number;
  skipped: number;
  scanned: number;
  nextCursor: string | null;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiOk | ApiErr>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!ADMIN_ACTION_KEY) return res.status(500).json({ ok: false, error: "ADMIN_ACTION_KEY is not configured" });

  const authKey = getAuthKey(req);
  if (!authKey || authKey !== ADMIN_ACTION_KEY) return res.status(401).json({ ok: false, error: "Unauthorized" });

  if (!isFirebaseAdminReady || !adminDb) return res.status(500).json({ ok: false, error: "Firebase Admin not initialized" });
  if (!hasStorageBucket()) return res.status(500).json({ ok: false, error: "Firebase Storage bucket not configured" });

  const max = Math.min(Math.max(Number(req.query.max || 100), 1), 500);
  const force = req.query.force === "true";
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";

  try {
    let q = adminDb.collection("listings").orderBy("__name__").limit(max);
    if (cursor) {
      const cursorRef = adminDb.collection("listings").doc(cursor);
      const cursorSnap = await cursorRef.get();
      if (cursorSnap.exists) q = q.startAfter(cursorSnap);
    }

    const snap = await q.get();
    let updated = 0;
    let skipped = 0;

    for (const doc of snap.docs) {
      const data: any = doc.data() || {};

      if (!force && (data.displayImageUrl || data.display_image_url)) {
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
      } catch {
        skipped++;
      }
    }

    const last = snap.docs[snap.docs.length - 1];
    return res.status(200).json({
      ok: true,
      updated,
      skipped,
      scanned: snap.size,
      nextCursor: snap.size === max && last ? last.id : null,
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error?.message || "Backfill failed" });
  }
}
