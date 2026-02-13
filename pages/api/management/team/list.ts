// FILE: /pages/api/management/team/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  if (!requireAdmin(req, res)) return;

  try {
    const snapshot = await adminDb
      .collection("management_team")
      .orderBy("createdAt", "asc")
      .get();

    const members = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        email: d.email,
        phone: d.phone || "",
        role: d.role || "Admin",
        permissions: {
          canManageSellers: d.permissions?.canManageSellers || false,
          canManageProducts: d.permissions?.canManageProducts || false,
          canManageFinance: d.permissions?.canManageFinance || false,
          canManageSupport: d.permissions?.canManageSupport || false,
        },
        createdAt: d.createdAt || "",
      };
    });

    return res.status(200).json({ ok: true, members });
  } catch (err: any) {
    console.error("Error listing team members:", err);
    return res.status(500).json({ ok: false, error: err?.message || "An internal error occurred." });
  }
}
