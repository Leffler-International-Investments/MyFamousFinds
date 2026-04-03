// FILE: /pages/api/admin/update-seller.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

const EDITABLE_FIELDS = [
  "businessName",
  "contactName",
  "contactEmail",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "zip",
  "country",
  "website",
  "social",
  "inventory",
  "status",
  "notes",
];

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
    const { id, ...fields } = req.body;

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing seller id." });
    }

    const updateData: Record<string, any> = {};
    for (const key of EDITABLE_FIELDS) {
      if (fields[key] !== undefined) {
        updateData[key] = fields[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ ok: false, error: "No fields to update." });
    }

    updateData.updatedAt = FieldValue.serverTimestamp();

    await adminDb.collection("sellers").doc(id).update(updateData);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error updating seller:", err);
    return res.status(500).json({ ok: false, error: err?.message || "An internal error occurred." });
  }
}
