// FILE: /pages/api/concierge.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import { getUserId } from "../../utils/authServer";

type Ok = { ok: true; id: string };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!adminDb) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  const uid = await getUserId(req); // can be null (guest), still allow lead capture
  const { name, email, city, details } = req.body || {};
  if (!name || !email) return res.status(400).json({ ok: false, error: "missing_fields" });

  const ref = await adminDb.collection("concierge_leads").add({
    userId: uid || null,
    name: String(name),
    email: String(email),
    city: String(city || ""),
    details: String(details || ""),
    createdAt: FieldValue.serverTimestamp(),
    status: "NEW",
  });

  return res.status(201).json({ ok: true, id: ref.id });
}
