// FILE: /pages/api/create-checkout-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createCheckoutSession } from "../../lib/stripe";
import { adminDb } from "../../utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!adminDb) {
      return res.status(500).json({ error: "Firebase not configured" });
    }

    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ error: "Missing listingId" });
    }

    // ✅ SERVER-SIDE listing validation
    const ref = adminDb.collection("listings").doc(String(listingId));
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listing: any = snap.data();
    const status = String(listing.status || "").toLowerCase();
    if (status !== "live" || listing.isSold === true) {
      return res.status(409).json({ error: "Listing not available" });
    }

    const price =
      typeof listing.priceUsd === "number"
        ? listing.priceUsd
        : Number(listing.price || 0);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    const title = String(listing.title || "Item").slice(0, 120);
    const image =
      listing.displayImageUrl ||
      listing.imageUrl ||
      (Array.isArray(listing.images) ? listing.images[0] : "");

    const session = await createCheckoutSession({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: title,
              images: image ? [image] : [],
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${listingId}`,
      metadata: {
        listingId: String(listingId),
        productTitle: title,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("create-checkout-session error", err);
    res.status(500).json({ error: "Checkout failed" });
  }
}
