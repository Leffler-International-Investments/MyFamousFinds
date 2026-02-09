// FILE: /pages/api/admin/approve-seller/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminDb } from "../../../../lib/firebaseAdmin";
import { sendSellerInviteEmail } from "../../../../utils/email";

type Res =
  | { ok: true; emailSent: boolean }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Res>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

    // Optional simple admin gate (if you already use it elsewhere)
    const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const headerEmail = String(req.headers["x-admin-email"] || "")
      .trim()
      .toLowerCase();
    if (adminEmail && headerEmail && adminEmail !== headerEmail) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const db = getAdminDb();

    // sellerApplications/{id}
    const ref = db.collection("sellerApplications").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "Seller not found" });
    }

    const data: any = snap.data() || {};
    const email = String(data.email || "").trim().toLowerCase();
    const businessName = String(data.businessName || data.shopName || "").trim();

    // Mark approved
    await ref.set(
      {
        status: "approved",
        approvedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // Create /sellerProfiles/{id} if you use it elsewhere
    try {
      await db
        .collection("sellerProfiles")
        .doc(id)
        .set(
          {
            email,
            businessName,
            status: "approved",
            updatedAt: Date.now(),
          },
          { merge: true }
        );
    } catch (e) {
      console.error("approve-seller sellerProfiles write failed", e);
    }

    // Build register URL (adjust if you want a different path)
    const siteUrl = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim();
    const base = siteUrl || "https://www.myfamousfinds.com";
    const registerUrl = `${base}/seller/register?email=${encodeURIComponent(
      email
    )}`;

    // ✅ FIX: call sendSellerInviteEmail(to, inviteUrl)
    let emailSent = false;
    try {
      if (email && email.includes("@")) {
        await sendSellerInviteEmail(email, registerUrl);
        emailSent = true;
      }
    } catch (e) {
      console.error("approve-seller invite email failed", e);
    }

    return res.status(200).json({ ok: true, emailSent });
  } catch (e: any) {
    console.error("approve-seller error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Server error" });
  }
}
