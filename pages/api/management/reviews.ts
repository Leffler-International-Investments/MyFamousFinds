// FILE: /pages/api/management/reviews.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

type ApiResponse =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (!requireAdmin(req, res)) return;

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  const collectionRef = adminDb.collection("reviews");

  try {
    const { method } = req;

    if (method === "POST") {
      const { rating, comment, authorName } = req.body || {};

      const ratingNum = Number(rating);
      if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res
          .status(400)
          .json({ ok: false, error: "Rating must be a number between 1 and 5" });
      }

      const commentStr = String(comment || "").trim();
      if (!commentStr) {
        return res
          .status(400)
          .json({ ok: false, error: "Comment is required" });
      }

      const docRef = await collectionRef.add({
        rating: Math.round(ratingNum),
        comment: commentStr,
        authorName: String(authorName || "").trim(),
        source: "admin",
        createdAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ ok: true, id: docRef.id });
    }

    if (method === "DELETE") {
      const id =
        (req.query.id as string | undefined) ||
        (req.body && (req.body.id as string | undefined));

      if (!id || typeof id !== "string") {
        return res
          .status(400)
          .json({ ok: false, error: "Missing review id" });
      }

      await collectionRef.doc(String(id)).delete();
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "POST,DELETE");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  } catch (error: any) {
    console.error("Error in /api/management/reviews:", error);
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Server error" });
  }
}
