// FILE: /pages/api/management/team/update.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";
import { normalizePhoneE164 } from "../../../../utils/sms";

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
    const { id, name, phone, role, permissions } = req.body;

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing member id." });
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = normalizePhoneE164(phone);
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) {
      updateData.permissions = {
        canManageSellers: permissions.canManageSellers || false,
        canManageProducts: permissions.canManageProducts || false,
        canManageFinance: permissions.canManageFinance || false,
        canManageSupport: permissions.canManageSupport || false,
      };
    }

    await adminDb.collection("management_team").doc(id).update(updateData);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error updating team member:", err);
    return res.status(500).json({ ok: false, error: err?.message || "An internal error occurred." });
  }
}
