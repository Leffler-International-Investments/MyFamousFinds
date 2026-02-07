// FILE: /pages/api/management/seller-status.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

type Response =
  | { ok: true }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  try {
    const { id, decision } = req.body as {
      id?: string;
      decision?: "approved" | "rejected";
    };

    if (!id || !decision) {
      return res
        .status(400)
        .json({ ok: false, error: "missing_parameters" });
    }

    // Store lowercase values so existing checks like `=== "approved"`
    // keep working everywhere else.
    await adminDb.collection("sellers").doc(id).update({
      status: decision,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("seller_status_update_error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
