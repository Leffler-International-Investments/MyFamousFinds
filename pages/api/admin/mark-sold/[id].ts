// FILE: /pages/api/admin/mark-sold/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";

// ⬇️ COPY THIS EXACT PATH FROM YOUR WORKING delete/[id].ts
// If delete/[id].ts uses "../../../utils/firebaseAdmin", keep it.
// If it uses "../../../../utils/firebaseAdmin", keep that.
// USE THE SAME PATH EXACTLY.
import { adminDb } from "../../../../utils/firebaseAdmin";

import { FieldValue } from "firebase-admin/firestore";

type ApiResponse = {
  ok: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "Missing listing id" });
  }

  try {
    // 1. Reference the listing
    const ref = adminDb.collection("listings").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res
        .status(404)
        .json({ ok: false, error: "Listing not found" });
    }

    // 2. Mark it SOLD and hide from public instantly
    await ref.set(
      {
        status: "Sold",
        soldAt: FieldValue.serverTimestamp(),
        visibility: {
          public: false, // ← will remove from index automatically
          searchable: false,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("mark-sold error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Internal error",
    });
  }
}
