// FILE: /pages/api/disputes/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  const uid = getUserId(req);
  const { orderId, role, reason, details } = req.body || {};
  if (!orderId || !role || !reason) return res.status(400).json({ ok:false, error:"missing_fields" });

  const ref = await adminDb.collection("disputes").add({
    orderId: String(orderId),
    openedBy: uid,
    role: String(role),            // "Buyer" | "Seller"
    reason: String(reason),        // enum-ish
    details: String(details||""),
    status: "OPEN",                // OPEN | PENDING | RESOLVED | REFUNDED
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return res.status(201).json({ ok:true, ticketId: ref.id });
}
