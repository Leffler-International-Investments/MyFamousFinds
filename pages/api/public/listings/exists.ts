// FILE: /pages/api/public/listings/exists.ts
// Public endpoint used by the "Recently Viewed" widget to validate
// localStorage items without requiring public Firestore read permissions.
// Uses Admin SDK so it works regardless of Firestore security rules.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../../utils/firebaseAdmin";
import { getDeletedListingIds } from "../../../../lib/deletedListings";

type Resp =
  | { ok: true; exists: Record<string, boolean> }
  | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase admin not configured" });
  }

  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const cleaned = ids
    .map((x: any) => String(x || "").trim())
    .filter((x: string) => x.length > 0)
    .slice(0, 50); // cap at 50 to prevent abuse

  if (cleaned.length === 0) {
    return res.status(200).json({ ok: true, exists: {} });
  }

  try {
    const deleted = await getDeletedListingIds();

    const results: Record<string, boolean> = {};
    await Promise.all(
      cleaned.map(async (id: string) => {
        if (deleted.has(id)) {
          results[id] = false;
          return;
        }
        try {
          const snap = await adminDb!.collection("listings").doc(id).get();
          results[id] = snap.exists;
        } catch {
          // On error, be conservative — keep the item (don't auto-purge on transient errors)
          results[id] = true;
        }
      })
    );

    return res.status(200).json({ ok: true, exists: results });
  } catch (err: any) {
    console.error("public_listings_exists_error", err?.message || err);
    return res.status(500).json({ ok: false, error: err?.message || "Failed" });
  }
}
