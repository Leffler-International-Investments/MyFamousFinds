// FILE: /pages/api/reviews/submit.ts
// Public endpoint for customers to submit a written review.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

type ApiResponse =
  | { ok: true; id: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "Server not configured" });
  }

  const { rating, comment, authorName } = req.body || {};

  const ratingNum = Number(rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({
      ok: false,
      error: "Rating must be between 1 and 5",
    });
  }

  const commentStr = String(comment || "").trim();
  if (!commentStr) {
    return res.status(400).json({ ok: false, error: "Comment is required" });
  }
  if (commentStr.length > 1000) {
    return res
      .status(400)
      .json({ ok: false, error: "Comment is too long (max 1000 chars)" });
  }

  try {
    const docRef = await adminDb.collection("reviews").add({
      rating: Math.round(ratingNum),
      comment: commentStr,
      authorName: String(authorName || "").trim().slice(0, 80),
      source: "public",
      createdAt: FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ ok: true, id: docRef.id });
  } catch (err: any) {
    console.error("Error submitting review:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Server error",
    });
  }
}
