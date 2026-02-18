// FILE: /pages/api/paypal/create-order.ts
// Creates a PayPal order for a validated listing + buyer details.

import type { NextApiRequest, NextApiResponse } from "next";
import { createPayPalOrder } from "../../../lib/paypal";
import { adminDb } from "../../../utils/firebaseAdmin";

type RequestBody = {
  id: string; // listingId
  buyerDetails?: {
    fullName?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

type SuccessResponse = { ok: true; orderId: string; approveUrl: string };
type ErrorResponse = { ok: false; error: string };

function resolveBaseUrl(req: NextApiRequest) {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const fromHeader = String(req.headers.origin || "").trim();

  for (const candidate of [fromEnv, fromHeader]) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {}
  }
  return "https://www.myfamousfinds.com";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "Firebase not configured" });
    }

    const { id, buyerDetails } = (req.body || {}) as RequestBody;

    if (!id) {
      return res.status(400).json({ ok: false, error: "Missing listing id" });
    }

    // Require buyer details
    const requiredBuyerFields = [
      buyerDetails?.fullName,
      buyerDetails?.email,
      buyerDetails?.phone,
      buyerDetails?.addressLine1,
      buyerDetails?.city,
      buyerDetails?.state,
      buyerDetails?.postalCode,
      buyerDetails?.country,
    ];
    const buyerDetailsComplete = requiredBuyerFields.every(
      (value) => typeof value === "string" && value.trim().length > 0
    );
    if (!buyerDetailsComplete) {
      return res.status(400).json({ ok: false, error: "Missing buyer details" });
    }

    // Server-side listing validation
    const listingRef = adminDb.collection("listings").doc(String(id));
    const listingSnap = await listingRef.get();
    if (!listingSnap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listing: any = listingSnap.data() || {};
    const status = String(listing.status || "").toLowerCase();
    const isSold =
      listing.isSold === true || listing.sold === true || status === "sold";
    const isLive =
      status === "live" ||
      status === "active" ||
      status === "approved" ||
      status === "published";

    if (!isLive || isSold) {
      return res.status(409).json({ ok: false, error: "Listing not available" });
    }

    const listingPrice =
      typeof listing.priceUsd === "number"
        ? listing.priceUsd
        : typeof listing.price === "number"
        ? listing.price
        : Number(listing.price || 0);

    if (!Number.isFinite(listingPrice) || listingPrice <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid listing price" });
    }

    const title = String(listing.title || listing.name || "Item").slice(0, 120);
    const brand = String(listing.brand || listing.designer || "").slice(0, 120);
    const category = String(listing.category || listing.menuCategory || "").slice(0, 120);
    const currency = String(listing.currency || "usd").toUpperCase() || "USD";

    const baseUrl = resolveBaseUrl(req);

    // Capture buyer UID if authenticated
    const buyerId = String(req.headers["x-user-id"] || "").trim() || undefined;

    // Store pending order details in Firestore so we can retrieve them on capture
    const pendingOrderRef = adminDb.collection("pending_orders").doc();
    await pendingOrderRef.set({
      listingId: String(id),
      productTitle: title,
      brand,
      category,
      listingPrice,
      currency,
      ...(buyerId ? { buyerId } : {}),
      buyerDetails: {
        fullName: buyerDetails?.fullName || "",
        email: buyerDetails?.email || "",
        phone: buyerDetails?.phone || "",
        addressLine1: buyerDetails?.addressLine1 || "",
        addressLine2: buyerDetails?.addressLine2 || "",
        city: buyerDetails?.city || "",
        state: buyerDetails?.state || "",
        postalCode: buyerDetails?.postalCode || "",
        country: buyerDetails?.country || "",
      },
      createdAt: Date.now(),
    });

    const order = await createPayPalOrder({
      listingId: String(id),
      title,
      amount: listingPrice,
      currency,
      returnUrl: `${baseUrl}/order/success?pending=${pendingOrderRef.id}`,
      cancelUrl: `${baseUrl}/product/${id}`,
      buyerEmail: buyerDetails?.email,
      metadata: {
        listingId: String(id),
        pendingOrderId: pendingOrderRef.id,
      },
    });

    // Update pending order with PayPal order ID
    await pendingOrderRef.update({ paypalOrderId: order.id });

    // Find the approval URL
    const approveUrl =
      order.links?.find((l: any) => l.rel === "approve")?.href ||
      order.links?.find((l: any) => l.rel === "payer-action")?.href ||
      "";

    if (!approveUrl) {
      throw new Error("No PayPal approval URL returned");
    }

    return res.status(200).json({
      ok: true,
      orderId: order.id,
      approveUrl,
    });
  } catch (err: any) {
    const msg = String(err?.message || err || "PayPal error");
    console.error("PayPal create order error:", msg, err);
    return res.status(500).json({ ok: false, error: msg });
  }
}
