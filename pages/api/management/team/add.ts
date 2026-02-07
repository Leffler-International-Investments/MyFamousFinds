// FILE: /pages/api/management/team/add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "../../../../utils/firebaseAdmin";

// --- Server-side check for "Owner" role ---
async function isOwner(req: NextApiRequest): Promise<boolean> {
  const email = String(
    req.headers["x-management-email"] || req.body?.requesterEmail || ""
  ).trim().toLowerCase();

  if (!email) return false;

  const allowList = (process.env.MANAGEMENT_SUPER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return allowList.includes(email);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  // --- 1. Security Check ---
  if (!(await isOwner(req))) {
    return res.status(403).json({ ok: false, error: "Not authorized" });
  }

  try {
    const { name, email, phone, permissions } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ ok: false, error: "Missing required fields." });
    }

    const rawPermissions = permissions || {};

    const auth = getAuth();

    // --- 2. Create User in Firebase Authentication ---
    const userRecord = await auth.createUser({
      email: email,
      phoneNumber: phone,
      displayName: name,
      password: `temp_${Math.random().toString(36).slice(-8)}`,
    });

    // --- 3. Save Permissions in Firestore ---
    await adminDb.collection("management_team").doc(userRecord.uid).set({
      name: name,
      email: email,
      phone: phone,
      role: "Admin",
      permissions: {
        canManageSellers: rawPermissions.perm_sellers || false,
        canManageProducts: rawPermissions.perm_products || false,
        canManageFinance: rawPermissions.perm_finance || false,
        canManageSupport: rawPermissions.perm_support || false,
      },
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ ok: true, uid: userRecord.uid });

  } catch (err: any) {
    console.error("Error creating team member:", err);
    if (err.code === "auth/email-already-exists") {
      return res.status(409).json({ ok: false, error: "Email already in use." });
    }
    return res.status(500).json({ ok: false, error: "An internal error occurred." });
  }
}
