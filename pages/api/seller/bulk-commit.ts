// FILE: /pages/api/seller/bulk-commit.ts
// Accepts rows from seller bulk upload / bulk-simple and creates
// docs in the "listings" collection so they appear in the
// management listing queue for approval.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { getSellerId } from "../../../utils/authServer";

// ---------- Types ----------
type IncomingRow = {
  title?: string;
  brand?: string;
  category?: string;
  condition?: string;
  size?: string;
  color?: string;
  price?: number | string;
  purchase_source?: string;
  purchase_proof?: string;
  serial_number?: string;
};

type CleanRow = {
  title: string;
  brand: string;
  category: string;
  condition: string;
  // OPTIONAL FIELDS (can be empty strings)
  size: string;
  color: string;
  purchase_source: string;
  purchase_proof: string;
  serial_number: string;
  price: number;
  _source?: "bulk";
  currency: "USD";
  status: "pending_review";
};

type ApiOk = { ok: true; created: number; skipped: number };
type ApiErr = { ok: false; error: string };

// ---------- Helpers ----------
function isFinitePositiveNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function toStr(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function coercePrice(v: unknown): number | null {
  if (typeof v === "number") return isFinitePositiveNumber(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return isFinitePositiveNumber(n) ? n : null;
  }
  return null;
}

// IMPORTANT: only require title, brand, category, condition, price.
// Everything else is optional and can be blank.
function cleanRow(r: IncomingRow): CleanRow | null {
  const title = toStr(r.title);
  const brand = toStr(r.brand);
  const category = toStr(r.category);
  const condition = toStr(r.condition);
  const size = toStr(r.size);
  const color = toStr(r.color);
  const purchase_source = toStr(r.purchase_source);
  const purchase_proof = toStr(r.purchase_proof);
  const serial_number = toStr(r.serial_number);
  const price = coercePrice(r.price);

  if (!title || !brand || !category || !condition || price == null) {
    // core fields missing => skip
    return null;
  }

  return {
    title,
    brand,
    category,
    condition,
    size,
    color,
    purchase_source,
    purchase_proof,
    serial_number,
    price,
    _source: "bulk",
    currency: "USD",
    status: "pending_review",
  };
}

// Designers directory: used only to FLAG, not to block rows.
async function getApprovedDesigners(): Promise<Set<string>> {
  const snap = await adminDb.collection("designers").get();
  const set = new Set<string>();
  if (snap.empty) return set;

  snap.forEach((d) => {
    const data = d.data() as any;
    if (data && data.name && data.active !== false) {
      set.add(String(data.name).trim().toLowerCase());
    }
  });
  return set;
}

// ---------- Handler ----------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ ok: false, error: "Method not allowed" });
    }

    const { rows } = (req.body || {}) as { rows?: IncomingRow[] };
    if (!Array.isArray(rows)) {
      return res
        .status(400)
        .json({ ok: false, error: "Body must include array 'rows'" });
    }

    const sellerId = getSellerId(req) || "seller-demo-001";

    const approvedDesigners = await getApprovedDesigners();
    const enforceDesigners = approvedDesigners.size > 0;

    const MAX_PER_REQUEST = 500;
    const slice = rows.slice(0, MAX_PER_REQUEST);

    let created = 0;
    let skipped = 0;

    const batch = adminDb.batch();

    for (const raw of slice as IncomingRow[]) {
      const cleaned = cleanRow(raw);
      if (!cleaned) {
        skipped++;
        continue;
      }

      const brandKey = cleaned.brand.toLowerCase();
      const isApprovedDesigner =
        enforceDesigners && approvedDesigners.has(brandKey);

      const ref = adminDb.collection("listings").doc();
      const docData: any = {
        ...cleaned,
        sellerId,
        designerStatus: isApprovedDesigner ? "approved" : "unlisted",
        pricing: {
          amount: cleaned.price,
          currency: "USD",
        },
        visibility: {
          public: false,
          searchable: false,
        },
        vetting: {
          stage: "intake",
          by: "bulk-upload",
          at: FieldValue.serverTimestamp(),
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      batch.set(ref, docData);
      created++;
    }

    if (created > 0) {
      await batch.commit();
    }

    return res.status(200).json({ ok: true, created, skipped });
  } catch (err: any) {
    console.error("bulk-commit error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Internal error" });
  }
}
