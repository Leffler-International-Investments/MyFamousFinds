// FILE: /pages/api/management/updateListing.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import {
  createWhiteDisplayImage,
  fetchImageBuffer,
  hasStorageBucket,
  parseDataUrl,
  storeListingImages,
} from "../../../utils/listingImageProcessing";

function canonCategory(
  input?: any
): "" | "WOMEN" | "BAGS" | "MEN" | "JEWELRY" | "WATCHES" {
  if (!input) return "";
  const s = String(input).trim().toUpperCase();

  if (s === "WOMAN") return "WOMEN";
  if (s === "BAG") return "BAGS";
  if (s === "WATCH") return "WATCHES";

  // Jewelry variants + common typo
  if (s === "JEWELLERY" || s === "JEWELERY" || s === "JEWELRY") return "JEWELRY";

  if (s === "WOMEN" || s === "BAGS" || s === "MEN" || s === "WATCHES") return s as any;

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
          const displayBuffer = await createWhiteDisplayImage(
            imageBuffer.buffer,
            imageBuffer.contentType
          );
          nextPatch.imageUrl = imageInput;
          nextPatch.displayImageUrl = `data:image/jpeg;base64,${displayBuffer.toString("base64")}`;
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
