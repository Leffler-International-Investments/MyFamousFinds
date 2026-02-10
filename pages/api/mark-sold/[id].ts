// FILE: /pages/api/mark-sold/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

type ApiResponse = { ok: true } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "Firebase not configured" });
    }
    if (!requireAdmin(req, res)) {
      return;
    }

    const { id: queryId } = req.query;
    const { id: bodyId } = req.body || {};
    const id = (queryId || bodyId) as string | string[] | undefined;

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing listing ID" });
    }

    const listingId = Array.isArray(id) ? id[0] : id;

    const docRef = adminDb.collection("listings").doc(listingId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    await docRef.set(
      {
        status: "Sold",
        soldAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("mark-sold error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Internal error" });
  }
}
