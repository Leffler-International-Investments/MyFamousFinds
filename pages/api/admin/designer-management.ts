// FILE: /pages/api/admin/designer-management.ts
// Admin ability to add/update/remove brands/categories
// Collaborative decision-making on brand acceptance
// Focus on contemporary, accessible luxury (avoid Walmart/Target tier)

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

const BLOCKED_TIERS = [
  "walmart",
  "target",
  "kmart",
  "primark",
  "shein",
  "fashion nova",
  "forever 21",
  "h&m",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requireAdmin(req, res)) return;

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_admin_not_initialized" });
  }

  if (req.method === "GET") {
    // List all designers with their acceptance status
    try {
      const snap = await adminDb.collection("designers").get();
      const designers = snap.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          name: data.name || doc.id,
          slug: data.slug || "",
          tier: data.tier || "contemporary",
          active: data.active !== false,
          addedBy: data.addedBy || "",
          addedAt: data.addedAt?.toMillis?.() || 0,
          approvedBy: data.approvedBy || "",
          notes: data.notes || "",
        };
      });

      designers.sort((a, b) => a.name.localeCompare(b.name));
      return res.status(200).json({ ok: true, designers });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message || "Server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { action, designerId, name, slug, tier, notes, addedBy } =
        req.body || {};

      if (action === "add") {
        if (!name) {
          return res.status(400).json({ ok: false, error: "missing_name" });
        }

        // Block non-luxury brands
        const nameLower = name.toLowerCase().trim();
        if (BLOCKED_TIERS.some((b) => nameLower.includes(b))) {
          return res.status(400).json({
            ok: false,
            error: "brand_tier_rejected",
            message:
              "This brand does not meet our contemporary/accessible luxury criteria.",
          });
        }

        const docId =
          slug ||
          name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        await adminDb
          .collection("designers")
          .doc(docId)
          .set(
            {
              name: name.trim(),
              slug: docId,
              tier: tier || "contemporary",
              active: true,
              addedBy: addedBy || "",
              addedAt: FieldValue.serverTimestamp(),
              notes: notes || "",
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        return res.status(200).json({ ok: true, designerId: docId });
      }

      if (action === "update" && designerId) {
        const updates: any = { updatedAt: FieldValue.serverTimestamp() };
        if (name !== undefined) updates.name = name;
        if (tier !== undefined) updates.tier = tier;
        if (notes !== undefined) updates.notes = notes;

        await adminDb.collection("designers").doc(designerId).update(updates);
        return res.status(200).json({ ok: true });
      }

      if (action === "toggle" && designerId) {
        const doc = await adminDb.collection("designers").doc(designerId).get();
        if (!doc.exists) {
          return res.status(404).json({ ok: false, error: "designer_not_found" });
        }
        const currentActive = (doc.data() as any).active !== false;
        await adminDb.collection("designers").doc(designerId).update({
          active: !currentActive,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return res.status(200).json({ ok: true, active: !currentActive });
      }

      if (action === "delete" && designerId) {
        await adminDb.collection("designers").doc(designerId).delete();
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: "invalid_action" });
    } catch (err: any) {
      console.error("admin/designer-management error", err);
      return res.status(500).json({ ok: false, error: err?.message || "Server error" });
    }
  }

  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
