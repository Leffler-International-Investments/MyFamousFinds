// FILE: pages/api/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import {
  sendOrderConfirmationEmail,
  OrderEmailPayload,
} from "../../utils/email";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.warn(
    "[stripe webhook] STRIPE_WEBHOOK_SECRET is not set – webhook verification will fail."
  );
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  return await new Promise((resolve, reject) => {
    req.on("data", (chunk) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(err));
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res
      .status(405)
      .setHeader("Allow", "POST")
      .json({ error: "Method not allowed" });
    return;
  }

  let event: Stripe.Event;

  try {
    const buf = await getRawBody(req);
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).send("Missing Stripe signature header");
    }

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret!);
  } catch (err: any) {
    console.error("Stripe webhook signature error:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const listingId = session.metadata?.listingId;
        const paymentStatus = session.payment_status;

        if (!listingId || paymentStatus !== "paid") break;

        const listingRef = adminDb.collection("listings").doc(listingId);
        const listingSnap = await listingRef.get();
        const listing = listingSnap.data() || {};

        // Mark listing as Sold
        await listingRef.update({
          status: "Sold",
          updatedAt: FieldValue.serverTimestamp(),
          stripePaymentIntent: session.payment_intent || null,
        });

        // Create order record
        const buyerEmail = session.customer_details?.email || "";
        const buyerName = session.customer_details?.name || "";
        const currency = (session.currency || "usd").toUpperCase();
        const amountTotal = (session.amount_total || 0) / 100;
        const subtotal = (session.amount_subtotal || amountTotal) / 100;
        const shipping = Math.max(0, amountTotal - subtotal);

        const ordersRef = adminDb.collection("orders");
        const orderDoc = {
          listingId,
          listingTitle: listing.title || "Product",
          listingBrand: listing.brand || "",
          listingCategory: listing.category || "",
          price: listing.price || amountTotal,
          currency,
          buyerEmail,
          buyerName,
          sellerId: listing.sellerId || null,
          sellerName:
            listing.sellerName ||
            listing.sellerDisplayName ||
            "Independent seller",
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
          status: "Paid",
          createdAt: FieldValue.serverTimestamp(),
        };

        const orderRef = await ordersRef.add(orderDoc);
        const orderId = orderRef.id;

        // Send email receipt
        if (buyerEmail) {
          const emailPayload: OrderEmailPayload = {
            id: orderId,
            customerName: buyerName || undefined,
            customerEmail: buyerEmail,
            currency,
            items: [
              {
                name: listing.title || "Product",
                brand: listing.brand || "",
                category: listing.category || "",
                quantity: 1,
                price: subtotal || amountTotal,
              },
            ],
            subtotal: subtotal || amountTotal,
            shipping,
            total: amountTotal,
          };

          try {
            await sendOrderConfirmationEmail(emailPayload);
          } catch (emailErr) {
            console.error(
              "Failed to send order confirmation email:",
              (emailErr as any)?.message || emailErr
            );
          }
        }

        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook handler error:", err?.message || err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
