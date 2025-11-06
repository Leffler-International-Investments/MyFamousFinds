// FILE: /pages/api/management/team/add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "../../../../utils/firebaseAdmin";

// --- IMPORTANT: Server-side check for "Owner" role ---
async function isOwner(req: NextApiRequest): Promise<boolean> {
  // TODO: CRITICAL SECURITY VULNERABILITY
  // As noted, this MUST be replaced with real server-side
  // session/token validation before going to production.
  // This check currently allows ANYONE to create an admin.
  // (e.g., decode a cookie, check Firestore for an admin record)
  console.warn("CRITICAL: 'isOwner' check is returning 'true' for all requests.");
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
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

    // --- ADDED: Guard against null/undefined permissions ---
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
      role: "Admin", // Or "Support", "Finance", etc.
      permissions: {
        // --- UPDATED: Use the safe 'rawPermissions' object ---
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
