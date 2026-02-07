// FILE: /pages/api/vip/join.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type VipMember = {
  uid: string;
  email: string | null;
  fullName: string | null;
  joinedAt: Date;
  points: number;
  tier: "Member" | "Silver" | "Gold" | "Platinum";
  lifetimeSpend: number;
};

type ApiResponse = { ok: true } | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  try {
    const { uid, email, fullName } = req.body || {};

    if (!uid || !email) {
      return res
        .status(400)
        .json({ ok: false, error: "missing_uid_or_email" });
    }

    const docRef = adminDb.collection("vip_members").doc(uid);

    const data: VipMember = {
      uid,
      email,
      fullName: fullName || null,
      // use plain Date so we don't depend on FieldValue helpers
      joinedAt: new Date(),
      points: 0,
      tier: "Member",
      lifetimeSpend: 0,
    };

    await docRef.set(data, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("vip_join_error", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
