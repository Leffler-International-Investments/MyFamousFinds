// FILE: /pages/api/seller/listings/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { getSellerId } from "../../../../utils/authServer";

type Ok = { ok: true };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const sellerId = await getSellerId(req);
  if (!sellerId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ ok: false, error: "invalid_listing_id" });

  const docRef = adminDb.collection("listings").doc(id);

  if (req.method === "DELETE") {
    try {
      const docSnap = await docRef.get();
      if (!docSnap.exists) return res.status(404).json({ ok: false, error: "listing_not_found" });

      const docData: any = docSnap.data() || {};
      if (String(docData?.sellerId || "") !== String(sellerId)) {
        return res.status(403).json({ ok: false, error: "forbidden" });
      }

      await docRef.delete();
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error("Delete listing error:", err);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
