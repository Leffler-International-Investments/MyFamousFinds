// FILE: /pages/api/admin/reject-seller/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";

type Data = { ok: true } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Missing seller id" });
    }

    const ref = adminDb.collection("sellers").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Seller application not found" });
    }

    await ref.set(
      {
        status: "Rejected",
        rejectedAt: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("reject_seller_error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal server error" });
  }
}
