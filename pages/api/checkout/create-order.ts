// FILE: /pages/api/checkout/create-order.ts
// Creates a PayPal order for all items currently in the buyer's cart.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady, FieldValue } from "../../../utils/firebaseAdmin";
import { getAuthUser } from "../../../utils/authServer";
import { createPayPalOrder } from "../../../lib/paypal";

type BuyerDetails = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
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
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!isFirebaseAdminReady || !adminDb)
    return res.status(500).json({ ok: false, error: "firebase_not_ready" });

  const user = await getAuthUser(req);
  if (!user?.uid)
    return res.status(401).json({ ok: false, error: "unauthorized" });

  const { buyerDetails } = (req.body || {}) as { buyerDetails?: BuyerDetails };

  const userRef = adminDb.collection("users").doc(user.uid);
  const userSnap = await userRef.get();
  const userData: any = userSnap.exists ? userSnap.data() || {} : {};

  const requiredFields = [
    buyerDetails?.fullName,
    buyerDetails?.email,
    buyerDetails?.phone,
    buyerDetails?.addressLine1,
    buyerDetails?.city,
    buyerDetails?.state,
    buyerDetails?.postalCode,
    buyerDetails?.country,
  ];
  if (!requiredFields.every((v) => typeof v === "string" && v.trim().length > 0)) {
    return res.status(400).json({ ok: false, error: "Missing shipping details" });
  }

  try {
    // Get cart items
    const cartSnap = await adminDb
      .collection("buyerCartItems")
      .where("userId", "==", user.uid)
      .get();

    if (cartSnap.empty) {
      return res.status(400).json({ ok: false, error: "Cart is empty" });
    }

    // Use the first item for the PayPal order (per-item checkout)
    const firstDoc = cartSnap.docs[0];
    const firstItem: any = firstDoc.data() || {};
    const listingId = firstItem.listingId || "";

    // Validate the listing
    const listingSnap = await adminDb.collection("listings").doc(listingId).get();
    if (!listingSnap.exists) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const listing: any = listingSnap.data() || {};
    const status = String(listing.status || "").toLowerCase();
    const isSold = listing.isSold === true || listing.sold === true || status === "sold";
    const isLive = ["live", "active", "approved", "published"].includes(status);

    if (!isLive || isSold) {
      return res.status(409).json({ ok: false, error: "Listing not available" });
    }

    const price =
      typeof listing.priceUsd === "number"
        ? listing.priceUsd
        : typeof listing.price === "number"
        ? listing.price
        : Number(listing.price || 0);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid listing price" });
    }

    const title = String(listing.title || listing.name || "Item").slice(0, 120);
    const currency = String(listing.currency || "USD").toUpperCase();
    const baseUrl = resolveBaseUrl(req);

    // Store pending order
    const pendingRef = adminDb.collection("pending_orders").doc();
    await pendingRef.set({
      listingId,
      productTitle: title,
      listingPrice: price,
      currency,
      buyerId: user.uid,
      buyerDetails: {
        fullName: buyerDetails!.fullName.trim(),
        email: buyerDetails!.email.trim().toLowerCase(),
        phone: buyerDetails!.phone.trim(),
        addressLine1: buyerDetails!.addressLine1.trim(),
        addressLine2: (buyerDetails!.addressLine2 || "").trim(),
        city: buyerDetails!.city.trim(),
        state: buyerDetails!.state.trim(),
        postalCode: buyerDetails!.postalCode.trim(),
        country: buyerDetails!.country.trim(),
      },
      fromCart: true,
      createdAt: Date.now(),
    });


    await userRef.set(
      {
        uid: user.uid,
        email: String(userData.email || user.email || buyerDetails!.email).trim().toLowerCase(),
        fullName: buyerDetails!.fullName.trim(),
        phone: buyerDetails!.phone.trim(),
        shippingAddress: {
          addressLine1: buyerDetails!.addressLine1.trim(),
          addressLine2: (buyerDetails!.addressLine2 || "").trim(),
          city: buyerDetails!.city.trim(),
          state: buyerDetails!.state.trim(),
          postalCode: buyerDetails!.postalCode.trim(),
          country: buyerDetails!.country.trim(),
        },
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: userData.createdAt || FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const order = await createPayPalOrder({
      listingId,
      title,
      amount: price,
      currency,
      returnUrl: `${baseUrl}/order/success?pending=${pendingRef.id}`,
      cancelUrl: `${baseUrl}/checkout`,
      buyerEmail: buyerDetails!.email,
      metadata: { listingId, pendingOrderId: pendingRef.id },
    });

    await pendingRef.update({ paypalOrderId: order.id });

    const approveUrl =
      order.links?.find((l: any) => l.rel === "approve")?.href ||
      order.links?.find((l: any) => l.rel === "payer-action")?.href ||
      "";

    if (!approveUrl) {
      throw new Error("No PayPal approval URL returned");
    }

    return res.status(200).json({ ok: true, orderId: order.id, approveUrl });
  } catch (err: any) {
    console.error("[checkout/create-order] Error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
