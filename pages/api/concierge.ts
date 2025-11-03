// FILE: /pages/api/concierge.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import { getUserId } from "../../utils/authServer";

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  const uid = getUserId(req);
  const { name, email, city, details } = req.body || {};
  if (!name || !email) return res.status(400).json({ ok:false, error:"missing_fields" });

  const ref = await adminDb.collection("concierge_leads").add({
    userId: uid, name: String(name), email: String(email), city: String(city||""),
    details: String(details||""), createdAt: FieldValue.serverTimestamp(), status:"NEW"
  });

  return res.status(201).json({ ok:true, id: ref.id });
}
