// FILE: /pages/api/sell.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue, adminAuth } from "../../utils/firebaseAdmin";

type SellResponse =
  | { ok: true; id: string }
  | { ok: false; error: string; message?: string };

// Helper: verify Firebase ID token for Open Market sellers
const getFirebaseUserId = async (req: NextApiRequest): Promise<string | null> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SellResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const body = (req.body || {}) as any;
    const {
      title,
      brand,
      category,
      condition,
      size,
      color,
      price,
      currency,
      image,
      description,
      listingType,
      purchase_source,
      purchase_proof,
      serial_number,
      auth_photos,
    } = body;

    if (!title || !price) {
      return res.status(400).json({ ok: false, error: "missing_title_or_price" });
    }

    // Only Open-Market sellers for now
    if (listingType === "open-market") {
      const sellerId = await getFirebaseUserId(req);
      if (!sellerId)
        return res.status(401).json({ ok: false, error: "unauthorized" });

      const sellerRef = adminDb.collection("users").doc(sellerId);
      const sellerDoc = await sellerRef.get();
      if (!sellerDoc.exists)
        return res.status(404).json({ ok: false, error: "user_not_found" });

      const { stripe_account_id, stripe_charges_enabled } = sellerDoc.data()!;
      if (!stripe_account_id || !stripe_charges_enabled)
        return res.status(400).json({
          ok: false,
          error: "payouts_not_enabled",
          message: "Complete your seller onboarding first.",
        });

      const numericPrice = Number(String(price).replace(/[^0-9.]/g, "")) || 0;
      const docData = {
        sellerId,
        sellerType: "open-market",
        stripe_account_id,
        title: String(title),
        brand: String(brand),
        category: String(category || "").toLowerCase(),
        condition: String(condition || ""),
        size: String(size || ""),
        color: String(color || ""),
        price: numericPrice,
        currency: currency || "USD",
        imageUrl: String(image || ""),
        description: String(description || ""),
        // ✅ authenticity fields
        purchase_source: String(purchase_source || ""),
        purchase_proof: String(purchase_proof || ""),
        serial_number: String(serial_number || ""),
        auth_photos: String(auth_photos || ""),
        status: "PendingReview" as const,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const ref = await adminDb.collection("listings").add(docData);
      return res.status(201).json({ ok: true, id: ref.id });
    }

    // Placeholder for permanent sellers (if needed)
    return res.status(400).json({ ok: false, error: "unsupported_listing_type" });
  } catch (err: any) {
    console.error("sell_api_error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
