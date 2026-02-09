// FILE: /pages/api/disputes/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getUserId } from "../../../utils/authServer";

type Ok = { ok: true; ticketId: string };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const uid = await getUserId(req);
  if (!uid) return res.status(401).json({ ok: false, error: "unauthorized" });

  const { orderId, role, reason, details } = req.body || {};
  if (!orderId || !role || !reason) return res.status(400).json({ ok: false, error: "missing_fields" });

  const ref = await adminDb.collection("disputes").add({
    orderId: String(orderId),
    openedBy: String(uid),
    role: String(role), // "Buyer" | "Seller"
    reason: String(reason),
    details: String(details || ""),
    status: "OPEN",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return res.status(201).json({ ok: true, ticketId: ref.id });
}
