// FILE: /pages/api/management/updateListing.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";
import sharp from "sharp";
import {
  createWhiteDisplayImage,
  fetchImageBuffer,
  hasStorageBucket,
  parseDataUrl,
  storeListingImages,
} from "../../../utils/listingImageProcessing";

function canonCategory(
  input?: any
): "" | "WOMEN" | "BAGS" | "MEN" | "KIDS" | "JEWELRY" | "WATCHES" {
  if (!input) return "";
  const s = String(input).trim().toUpperCase();

  if (s === "WOMAN") return "WOMEN";
  if (s === "BAG") return "BAGS";
  if (s === "WATCH") return "WATCHES";
  if (s === "KID" || s === "KIDS" || s === "CHILDREN" || s === "CHILDRENS") return "KIDS";

  // Jewelry variants + common typo
  if (s === "JEWELLERY" || s === "JEWELERY" || s === "JEWELRY") return "JEWELRY";

  if (s === "WOMEN" || s === "BAGS" || s === "MEN" || s === "KIDS" || s === "WATCHES") return s as any;

  return "";
}

function slugifyCategory(cat: string) {
  return String(cat || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    if (!requireAdmin(req, res)) return;

    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "Firebase not configured" });
    }

    const { id, patch } = req.body || {};
    if (!id || !patch) {
      return res.status(400).json({ ok: false, message: "Missing id or patch" });
    }

    const ref = adminDb.collection("listings").doc(String(id));
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ ok: false, message: "Listing not found" });
    }

    const nextPatch: any = { ...patch };

    const imageInput =
      nextPatch.imageUrl || nextPatch.image_url || nextPatch.imageDataUrl;

    if (imageInput) {
      try {
        let imageBuffer;
        if (typeof imageInput === "string" && imageInput.startsWith("data:image/")) {
          const parsed = parseDataUrl(imageInput);
          if (!parsed) {
            return res.status(400).json({ ok: false, message: "Invalid image data URL" });
          }
          imageBuffer = parsed;
        } else if (typeof imageInput === "string") {
          imageBuffer = await fetchImageBuffer(imageInput);
        }

        if (!imageBuffer) {
          return res.status(400).json({ ok: false, message: "Invalid image input" });
        }

        if (hasStorageBucket()) {
          const stored = await storeListingImages(imageBuffer, "listing-images");
          nextPatch.imageUrl = stored.originalUrl;
          nextPatch.displayImageUrl = stored.displayUrl;
        } else {
          // No Storage bucket — compress to fit in Firestore (<1MB limit)
          const compressedBuffer = await sharp(imageBuffer.buffer)
            .rotate()
            .resize(800, 800, { fit: "inside", withoutEnlargement: true })
            .flatten({ background: "#ffffff" })
            .jpeg({ quality: 70, mozjpeg: true })
            .toBuffer();
          const compressedUrl = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`;
          nextPatch.imageUrl = compressedUrl;
          nextPatch.displayImageUrl = compressedUrl;
        }
      } catch (error) {
        console.warn("Update listing image failed:", error);
      }
    }

    // Normalize category on every update (fixes JEWELLERY / JEWELERY → JEWELRY)
    const normalized = canonCategory(
      nextPatch.category ?? (snap.data() as any)?.category
    );

    if (normalized) {
      nextPatch.category = normalized;
      nextPatch.categorySlug = slugifyCategory(normalized);
    }

    nextPatch.updatedAt = new Date();

    await ref.update(nextPatch);

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
}
