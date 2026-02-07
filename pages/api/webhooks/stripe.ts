// FILE: /pages/api/webhooks/stripe.ts
// --- This is the new file provided in your instructions ---
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {});
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
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", (err) => {
      reject(err);
    });
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

  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  let event: Stripe.Event;

  try {
    const buf = await getRawBody(req);
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).send("Missing Stripe signature header");
    }

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err?.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const listingId = session.metadata?.listingId;
        const userId = session.metadata?.userId; // VIP member id (optional)
        const paymentStatus = session.payment_status;

        if (listingId && paymentStatus === "paid") {
          // A. Mark the listing as sold
          const listingRef = adminDb.collection("listings").doc(listingId);
          await listingRef.update({
            status: "Sold",
            updatedAt: FieldValue.serverTimestamp(),
            stripePaymentIntent: session.payment_intent,
          });

          // B. Award VIP points if we know the member
          if (userId) {
            const amountSpent = (session.amount_total || 0) / 100;
            const pointsToAdd = Math.floor(amountSpent); // 1 point per $1
            const userRef = adminDb.collection("users").doc(userId);
            
            // Check if user document exists before updating
            const userDoc = await userRef.get();
            if (userDoc.exists) {
              await userRef.update({
                points: FieldValue.increment(pointsToAdd),
              });
              console.log(`Awarded ${pointsToAdd} points to user ${userId}`);
            } else {
              console.warn(`User ${userId} not found, cannot award points.`);
            }
          }
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const accountId = account.id;
        const chargesEnabled = account.charges_enabled;

        // This query confirms Sellers are in the 'users' collection
        const usersRef = adminDb.collection("users");
        const q = usersRef.where("stripe_account_id", "==", accountId);
        const querySnapshot = await q.get();

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await userDoc.ref.update({
            stripe_charges_enabled: chargesEnabled,
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log(
            `Updated user ${userDoc.id} with charges_enabled=${chargesEnabled}`
          );
        } else {
          console.warn(`No user found with Stripe account ${accountId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe webhook event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Error handling Stripe webhook:", err);
    return res.status(500).json({ error: "Webhook handler error" });
  }

  res.status(200).json({ received: true });
}
