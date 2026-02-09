// FILE: /pages/api/social/follow.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

type Ok = { ok: true };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const uid = await getUserId(req);
  if (!uid) return res.status(401).json({ ok: false, error: "unauthorized" });

  const { sellerId, follow } = req.body || {};
  if (!sellerId) return res.status(400).json({ ok: false, error: "missing_sellerId" });

  const doc = adminDb
    .collection("followers")
    .doc(String(uid))
    .collection("following")
    .doc(String(sellerId));

  if (follow) {
    await doc.set(
      { sellerId: String(sellerId), followedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  } else {
    await doc.delete();
  }

  return res.status(200).json({ ok: true });
}
