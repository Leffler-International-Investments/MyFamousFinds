// FILE: /pages/api/cron/check-tracking.ts
//
// Vercel Cron — runs every 6 hours (configured in vercel.json)
// 1. Finds orders in "Shipped" status with tracking numbers
// 2. Checks carrier tracking status via AfterShip API (if AFTERSHIP_API_KEY set)
// 3. Auto-updates order shipping status (in-transit → delivered)
// 4. When delivered: auto-confirms signature and starts payout cooling

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getPayoutSettings } from "../../../lib/payoutSettings";

type Data =
  | { ok: true; checked: number; delivered: number; errors: number }
  | { ok: false; error: string };

// ── Auth: Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" ──
function isCronAuthorized(req: NextApiRequest): boolean {
  // Vercel Cron sets this automatically when CRON_SECRET env var is configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const bearer = String(req.headers.authorization || "").replace("Bearer ", "");
    if (bearer === cronSecret) return true;
  }
  // Fallback: admin secret header (for manual triggers)
  const adminSecret = process.env.ADMIN_API_SECRET;
  if (adminSecret) {
    const got = String(req.headers["x-admin-secret"] || "");
    if (got === adminSecret) return true;
  }
  return false;
}

// ── AfterShip tracking lookup ──
type TrackingResult = {
  status: "in_transit" | "delivered" | "out_for_delivery" | "exception" | "unknown";
  signedBy?: string;
  deliveredAt?: string;
};

async function checkTrackingViaAfterShip(
  carrier: string,
  trackingNumber: string
): Promise<TrackingResult | null> {
  const apiKey = process.env.AFTERSHIP_API_KEY;
  if (!apiKey) return null;

  // Map our carrier names to AfterShip slug
  const slugMap: Record<string, string> = {
    ups: "ups",
    fedex: "fedex",
    "fed ex": "fedex",
    dhl: "dhl",
    usps: "usps",
    auspost: "australia-post",
    "australia post": "australia-post",
    tnt: "tnt",
    aramex: "aramex",
  };
  const slug = slugMap[carrier.toLowerCase().trim()] || carrier.toLowerCase().trim();

  try {
    const url = `https://api.aftership.com/v4/trackings/${slug}/${encodeURIComponent(trackingNumber)}`;
    const resp = await fetch(url, {
      headers: {
        "aftership-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      // If tracking not found, try to create it first
      if (resp.status === 404) {
        await fetch("https://api.aftership.com/v4/trackings", {
          method: "POST",
          headers: {
            "aftership-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tracking: { slug, tracking_number: trackingNumber },
          }),
        });
        return { status: "unknown" };
      }
      return null;
    }

    const json = await resp.json();
    const tracking = json?.data?.tracking;
    if (!tracking) return null;

    const tag = String(tracking.tag || "").toLowerCase();
    const signedBy = tracking.signed_by || "";

    if (tag === "delivered") {
      return {
        status: "delivered",
        signedBy: signedBy || undefined,
        deliveredAt: tracking.shipment_delivery_date || new Date().toISOString(),
      };
    }
    if (tag === "outfordelivery") return { status: "out_for_delivery" };
    if (tag === "exception") return { status: "exception" };
    if (tag === "intransit") return { status: "in_transit" };

    return { status: "unknown" };
  } catch (err) {
    console.warn("aftership_check_error", err);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (!isCronAuthorized(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "firebase_not_configured" });
  }

  try {
    // Query shipped orders that haven't been delivered yet
    const snap = await adminDb
      .collection("orders")
      .where("fulfillment.stage", "==", "SHIPPED")
      .limit(50)
      .get();

    let checked = 0;
    let delivered = 0;
    let errors = 0;

    for (const doc of snap.docs) {
      const o: any = doc.data() || {};
      const carrier = String(o.shipping?.carrier || "");
      const trackingNumber = String(o.shipping?.trackingNumber || "");

      if (!carrier || !trackingNumber) continue;

      checked++;

      try {
        const result = await checkTrackingViaAfterShip(carrier, trackingNumber);
        if (!result) continue; // AfterShip not configured or error

        // Update shipping status in Firestore
        const statusUpdate: Record<string, any> = {
          "shipping.lastCheckedAt": FieldValue.serverTimestamp(),
          "shipping.trackingStatus": result.status,
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (result.status === "delivered") {
          // Auto-confirm delivery and start payout cooling
          const { defaultCoolingDays } = await getPayoutSettings();
          const coolingDays =
            typeof o.payout?.coolingDays === "number"
              ? o.payout.coolingDays
              : defaultCoolingDays;

          const now = new Date();
          const eligibleAt = new Date(now.getTime() + coolingDays * 24 * 60 * 60 * 1000);

          await doc.ref.set(
            {
              status: "Completed",
              updatedAt: FieldValue.serverTimestamp(),
              shipping: {
                ...(o.shipping || {}),
                status: "delivered",
                trackingStatus: "delivered",
                deliveredAt: result.deliveredAt || FieldValue.serverTimestamp(),
                signedBy: result.signedBy || "",
                lastCheckedAt: FieldValue.serverTimestamp(),
              },
              fulfillment: {
                ...(o.fulfillment || {}),
                stage: "SIGNATURE_CONFIRMED",
                deliveredAt: result.deliveredAt || FieldValue.serverTimestamp(),
                signatureConfirmedAt: FieldValue.serverTimestamp(),
                signatureConfirmedBy: result.signedBy ? "carrier_auto" : "delivery_auto",
              },
              payout: {
                ...(o.payout || {}),
                coolingDays,
                status: "COOLING",
                eligibleAt,
                signatureConfirmedAt: FieldValue.serverTimestamp(),
              },
            },
            { merge: true }
          );

          delivered++;
        } else {
          // Just update tracking status
          await doc.ref.update(statusUpdate);
        }
      } catch (err) {
        console.error(`tracking_check_error order=${doc.id}`, err);
        errors++;
      }
    }

    return res.status(200).json({ ok: true, checked, delivered, errors });
  } catch (err: any) {
    console.error("check_tracking_cron_error", err);
    return res.status(500).json({ ok: false, error: err?.message || "internal_error" });
  }
}
