// /pages/api/admin/where-am-i.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Project identity from Admin SDK creds
    const projectId =
      process.env.FB_PROJECT_ID ||
      (process.env.GOOGLE_CLOUD_PROJECT as string) ||
      "unknown";

    const snap = await adminDb.collection("designers").limit(3).get();
    const countApprox = snap.size;

    res.status(200).json({
      ok: true,
      projectId,
      designers_found_in_first_page: countApprox,
      hint: "Open this project in Firebase console and check the 'designers' collection.",
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
}
