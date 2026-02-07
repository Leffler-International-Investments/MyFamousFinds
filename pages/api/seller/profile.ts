// FILE: /pages/api/seller/profile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Data =
  | { ok: true }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  try {
    const {
      businessName,
      email,
      mobile,
      country,
      bio,
      website,
      otherPlatforms,
      vettingNotes,
    } = req.body || {};

    if (!businessName || !email) {
      return res
        .status(400)
        .json({ error: "Business name and email are required." });
    }

    const emailKey = String(email).trim().toLowerCase();
    const ref = adminDb.collection("sellers").doc(emailKey);
    const snap = await ref.get();
    const now = new Date();

    const data: any = {
      businessName,
      email: emailKey,
      contactEmail: emailKey,
      mobile: mobile || "",
      country: country || "",
      bio: bio || "",
      website: website || "",
      otherPlatforms: otherPlatforms || "",
      vettingNotes: vettingNotes || "",
      updatedAt: now,
    };

    // Only set status to "Pending" for new profiles — never overwrite approved status
    if (!snap.exists) {
      data.createdAt = now;
      data.status = "Pending";
    }

    await ref.set(data, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("seller_profile_api_error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Internal server error" });
  }
}
