// FILE: pages/api/review-stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../utils/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "method_not_allowed" });
  }

  try {
    const snap = await adminDb.collection("reviews").get();
    let total = 0;
    let count = 0;

    snap.docs.forEach((doc) => {
      const data = doc.data();
      // Only include 4 and 5 star reviews in public stats
      if (typeof data.rating === "number" && data.rating >= 4) {
        total += data.rating;
        count++;
      }
    });

    const average = count > 0 ? total / count : null;

    return res.status(200).json({
      success: true,
      count,
      average,
    });
  } catch (err: any) {
    console.error("review-stats error", err);
    return res.status(500).json({ success: false, error: err?.message || "server_error" });
  }
}
