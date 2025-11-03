// FILE: /pages/api/social/follow.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  const uid = getUserId(req);
  const { sellerId, follow } = req.body || {};
  if (!sellerId) return res.status(400).json({ ok:false, error:"missing_sellerId" });

  const doc = adminDb
    .collection("followers")
    .doc(uid)
    .collection("following")
    .doc(String(sellerId));

  if (follow) {
    await doc.set({ sellerId: String(sellerId), followedAt: FieldValue.serverTimestamp() }, { merge:true });
  } else {
    await doc.delete();
  }

  return res.status(200).json({ ok:true });
}
