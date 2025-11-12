// /pages/api/admin/debug-designers.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import * as admin from "firebase-admin"; // for app options

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });

  const key = req.headers["x-admin-key"];
  if (!key || key !== process.env.ADMIN_SEED_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const app = admin.apps.length ? admin.app() : undefined;
    const opts: any = app?.options || {};
    const projectFromOptions = opts.projectId || process.env.FB_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "unknown";

    // 1) Try a single write
    const testId = "zzz-debug-test-doc";
    await adminDb.collection("designers").doc(testId).set({
      name: "DEBUG TEST",
      slug: "zzz-debug-test-doc",
      approved: true,
      active: true,
      _wroteAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // 2) Read first few docs back
    const snap = await adminDb.collection("designers").orderBy("slug").limit(3).get();

    res.status(200).json({
      ok: true,
      projectId_from_app_options: projectFromOptions,
      designers_count_first_page: snap.size,
      first_docs: snap.docs.map(d => ({ id: d.id, ...d.data() })),
      hint: "Open this project in Firebase console and look for 'designers' at the ROOT level.",
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e), stack: e?.stack });
  }
}
