// FILE: /pages/api/seller/bulk-commit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

// Disable default body parser to handle form-data
export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);

    const sellerId = fields.sellerId?.[0];
    const category = fields.category?.[0];
    const price = parseFloat(fields.price?.[0] || "0");
    const imageFile = files.image?.[0];

    if (!sellerId || !imageFile) {
      return res.status(400).json({ error: "Missing sellerId or image file" });
    }

    const bucket = getStorage().bucket();
    const fileId = uuidv4();
    const destPath = `uploads/${sellerId}/${fileId}_${imageFile.originalFilename}`;
    await bucket.upload(imageFile.filepath, {
      destination: destPath,
      metadata: { metadata: { firebaseStorageDownloadTokens: uuidv4() } },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      destPath
    )}?alt=media`;

    await adminDb.collection("listings").add({
      sellerId,
      category,
      price,
      image: publicUrl,
      createdAt: new Date(),
      status: "pending",
    });

    return res.status(200).json({ success: true, imageUrl: publicUrl });
  } catch (error: any) {
    console.error("Bulk commit failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
