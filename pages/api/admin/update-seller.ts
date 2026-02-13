// FILE: /pages/api/admin/update-seller.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";
import { normalizePhoneE164 } from "../../../utils/sms";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  if (!requireAdmin(req, res)) return;

  try {
    const { id, businessName, contactEmail, phone } = req.body;

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing seller id." });
    }

    const updateData: Record<string, any> = {};
    if (businessName !== undefined) updateData.businessName = businessName;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (phone !== undefined) {
      updateData.phone = phone ? normalizePhoneE164(phone) : "";
    }

    await adminDb.collection("sellers").doc(id).update(updateData);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error updating seller:", err);
    return res.status(500).json({ ok: false, error: err?.message || "An internal error occurred." });
  }
}
