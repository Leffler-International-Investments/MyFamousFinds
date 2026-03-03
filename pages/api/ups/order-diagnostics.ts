// FILE: /pages/api/ups/order-diagnostics.ts
// Comprehensive UPS label diagnostics for a specific order.
// POST /api/ups/order-diagnostics  { orderId: string }
//
// Checks everything that could prevent a UPS label from being generated
// or an email from being delivered: env vars, Firebase, seller address,
// order state, buyer address, UPS API reachability, and email outbox.

import type { NextApiRequest, NextApiResponse } from "next";
import admin, {
  adminDb,
  isFirebaseAdminReady,
} from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

type Severity = "error" | "warning";

type Check = {
  key: string;
  title: string;
  ok: boolean;
  details?: string;
  severity?: Severity;
};

type OutboxRow = {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  lastError?: string;
  to?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function has(v?: string): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function pass(key: string, title: string, details?: string): Check {
  return { key, title, ok: true, details };
}

function fail(
  key: string,
  title: string,
  details?: string,
  severity: Severity = "error"
): Check {
  return { key, title, ok: false, details, severity };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Authenticate seller
  const sellerId = await getSellerId(req);
  if (!sellerId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ ok: false, error: "Missing orderId" });
  }

  const checks: Check[] = [];
  const recommendations: string[] = [];

  // Placeholder order data — populated below
  const orderInfo: Record<string, any> = { id: orderId };
  const outbox: OutboxRow[] = [];

  // ────────────────────────────────────────────
  // 1. Environment variable checks
  // ────────────────────────────────────────────
  const upsClientId = process.env.UPS_CLIENT_ID;
  const upsClientSecret = process.env.UPS_CLIENT_SECRET;
  const upsAccount = process.env.UPS_ACCOUNT_NUMBER;
  const upsBaseUrl = process.env.UPS_BASE_URL;

  checks.push(
    has(upsClientId)
      ? pass("ups_client_id", "UPS_CLIENT_ID present")
      : fail(
          "ups_client_id",
          "UPS_CLIENT_ID present",
          "Missing — add UPS_CLIENT_ID to Vercel environment variables"
        )
  );

  checks.push(
    has(upsClientSecret)
      ? pass("ups_client_secret", "UPS_CLIENT_SECRET present")
      : fail(
          "ups_client_secret",
          "UPS_CLIENT_SECRET present",
          "Missing — add UPS_CLIENT_SECRET to Vercel environment variables"
        )
  );

  checks.push(
    has(upsAccount)
      ? pass("ups_account", "UPS_ACCOUNT_NUMBER present")
      : fail(
          "ups_account",
          "UPS_ACCOUNT_NUMBER present",
          "Missing — UPS labels require a shipper account number"
        )
  );

  checks.push(
    has(upsBaseUrl)
      ? pass("ups_base_url", "UPS_BASE_URL present", `Value: ${upsBaseUrl}`)
      : fail(
          "ups_base_url",
          "UPS_BASE_URL present",
          "Missing — should be https://onlinetools.ups.com (production) or https://wwwcie.ups.com (sandbox)",
          "warning"
        )
  );

  // ────────────────────────────────────────────
  // 2. Firebase Admin
  // ────────────────────────────────────────────
  checks.push(
    isFirebaseAdminReady && adminDb
      ? pass("firebase_admin", "Firebase Admin initialized")
      : fail(
          "firebase_admin",
          "Firebase Admin initialized",
          "Firebase Admin is not ready — check FIREBASE_SERVICE_ACCOUNT_JSON env var"
        )
  );

  // ────────────────────────────────────────────
  // 3. Firebase Storage bucket
  // ────────────────────────────────────────────
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "";

  checks.push(
    has(bucket)
      ? pass("storage_bucket", "Firebase Storage bucket configured", `Bucket: ${bucket}`)
      : fail(
          "storage_bucket",
          "Firebase Storage bucket configured",
          "Missing FIREBASE_STORAGE_BUCKET — labels can't be uploaded"
        )
  );

  // ────────────────────────────────────────────
  // 4. Email config (SES)
  // ────────────────────────────────────────────
  const sesFrom = process.env.AWS_SES_FROM || "";
  const sesKey = process.env.AWS_ACCESS_KEY_ID || "";
  const sesSecret = process.env.AWS_SECRET_ACCESS_KEY || "";

  checks.push(
    has(sesKey) && has(sesSecret)
      ? pass("email_ses", "AWS SES credentials present")
      : fail(
          "email_ses",
          "AWS SES credentials present",
          "Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY — label emails won't send via SES",
          "warning"
        )
  );

  checks.push(
    has(sesFrom)
      ? pass("email_from", "AWS_SES_FROM configured", `From: ${sesFrom}`)
      : fail(
          "email_from",
          "AWS_SES_FROM configured",
          "Missing — emails may use fallback sender",
          "warning"
        )
  );

  if (!adminDb) {
    checks.push(
      fail(
        "firestore_access",
        "Firestore accessible",
        "Cannot run order or seller checks — Firebase Admin not ready"
      )
    );
    recommendations.push(
      "Fix Firebase Admin configuration before any other checks can run."
    );
    return res.status(200).json({
      ok: true,
      checks,
      recommendations,
      order: orderInfo,
      outbox,
    });
  }

  // ────────────────────────────────────────────
  // 5. Order exists and belongs to seller
  // ────────────────────────────────────────────
  let orderData: any = null;
  try {
    const orderSnap = await adminDb
      .collection("orders")
      .doc(String(orderId))
      .get();

    if (!orderSnap.exists) {
      checks.push(
        fail("order_exists", "Order exists in Firestore", `Order ${orderId} not found`)
      );
      recommendations.push(
        "Double-check the order ID. The order may not have been created yet."
      );
      return res.status(200).json({
        ok: true,
        checks,
        recommendations,
        order: orderInfo,
        outbox,
      });
    }

    orderData = orderSnap.data() || {};
    checks.push(pass("order_exists", "Order exists in Firestore"));

    // Ownership
    const orderSellerId = String(orderData.sellerId || "");
    if (orderSellerId === String(sellerId)) {
      checks.push(pass("order_ownership", "Order belongs to this seller"));
    } else {
      checks.push(
        fail(
          "order_ownership",
          "Order belongs to this seller",
          `Order sellerId="${orderSellerId}" does not match your sellerId="${sellerId}"`
        )
      );
    }
  } catch (e: any) {
    checks.push(
      fail(
        "order_exists",
        "Order exists in Firestore",
        `Firestore error: ${e?.message || "Unknown"}`
      )
    );
  }

  // Populate order info for the response
  if (orderData) {
    orderInfo.status = orderData.status || orderData.fulfillment?.stage || "";
    orderInfo.sellerId = orderData.sellerId || "";
    orderInfo.buyerEmail = orderData.buyerEmail || "";
    orderInfo.shippingLabelStatus =
      orderData.shipping?.labelStatus || orderData.shippingLabelStatus || "";
    orderInfo.shippingTrackingNumber =
      orderData.shipping?.trackingNumber || orderData.shippingTrackingNumber || "";
    orderInfo.shippingLabelUrl =
      orderData.shipping?.labelUrl || orderData.shippingLabelUrl || "";
    orderInfo.shippingLabelError =
      orderData.shipping?.labelError || orderData.shippingLabelError || "";
  }

  // ────────────────────────────────────────────
  // 6. Order payment status
  // ────────────────────────────────────────────
  if (orderData) {
    const isPaid =
      orderData.paypalCaptured === true ||
      String(orderData.paypalStatus || "").toUpperCase() === "COMPLETED" ||
      String(orderData.status || "").toLowerCase() === "paid" ||
      String(orderData.fulfillment?.stage || "").toUpperCase() === "PAID";

    checks.push(
      isPaid
        ? pass(
            "order_paid",
            "Order is paid",
            `paypalCaptured=${orderData.paypalCaptured}, paypalStatus=${orderData.paypalStatus || "-"}, status=${orderData.status || "-"}`
          )
        : fail(
            "order_paid",
            "Order is paid",
            `Order must be paid before a label can be generated. status="${orderData.status || "-"}", paypalCaptured=${orderData.paypalCaptured}`
          )
    );
  }

  // ────────────────────────────────────────────
  // 7. Buyer shipping address
  // ────────────────────────────────────────────
  if (orderData) {
    const sa = orderData.shippingAddress;
    const hasBuyerAddr =
      sa && sa.line1 && sa.city && sa.state && sa.postal_code;

    checks.push(
      hasBuyerAddr
        ? pass(
            "buyer_address",
            "Buyer shipping address present",
            `${sa.name || "Buyer"}, ${sa.line1}, ${sa.city} ${sa.state} ${sa.postal_code}`
          )
        : fail(
            "buyer_address",
            "Buyer shipping address present",
            sa
              ? `Incomplete: line1="${sa.line1 || ""}", city="${sa.city || ""}", state="${sa.state || ""}", postal_code="${sa.postal_code || ""}"`
              : "No shippingAddress field on this order"
          )
    );
  }

  // ────────────────────────────────────────────
  // 8. Existing label (idempotency check)
  // ────────────────────────────────────────────
  if (orderData) {
    const ship = orderData.shipping || {};
    if (ship.trackingNumber && ship.labelUrl) {
      checks.push(
        pass(
          "label_already_generated",
          "Label already generated",
          `Tracking: ${ship.trackingNumber}, labelStatus: ${ship.labelStatus || "-"}`
        )
      );
    } else if (ship.labelStatus === "generated") {
      checks.push(
        fail(
          "label_already_generated",
          "Label URL present despite generated status",
          `labelStatus=generated but labelUrl is missing. Possible storage upload failure.`,
          "warning"
        )
      );
    } else {
      checks.push(
        fail(
          "label_already_generated",
          "Label generated for this order",
          "No label has been generated yet — this is expected if you haven't clicked Generate UPS Label",
          "warning"
        )
      );
    }

    // Check for label errors
    const labelError = ship.labelError || orderData.shippingLabelError || "";
    if (labelError) {
      checks.push(
        fail(
          "label_error",
          "No label generation errors",
          `Last error: ${labelError}`
        )
      );
    }
  }

  // ────────────────────────────────────────────
  // 9. Seller address resolution
  //    IMPORTANT: Use the ORDER's sellerId, not the logged-in user's sellerId.
  //    The diagnostics should check the actual seller who needs to ship, not
  //    whoever is viewing the diagnostics page.
  // ────────────────────────────────────────────
  const orderSellerId = String(orderData?.sellerId || sellerId);
  let sellerEmail = "";
  let sellerAddressOk = false;
  let sellerAddressSource = "";

  try {
    let sellerDoc = await adminDb
      .collection("sellers")
      .doc(String(orderSellerId))
      .get();

    // If doc not found by ID, try by email / contactEmail queries
    if (!sellerDoc.exists) {
      const byEmail = await adminDb
        .collection("sellers")
        .where("email", "==", orderSellerId)
        .limit(1)
        .get();
      if (!byEmail.empty) sellerDoc = byEmail.docs[0];
    }
    if (!sellerDoc.exists) {
      const byContact = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", orderSellerId)
        .limit(1)
        .get();
      if (!byContact.empty) sellerDoc = byContact.docs[0];
    }

    if (sellerDoc.exists) {
      const sd: any = sellerDoc.data() || {};
      sellerEmail = String(sd.contactEmail || sd.email || "")
        .trim()
        .toLowerCase();

      // Check structured shippingAddress block on profile
      const addr = sd.shippingAddress || null;
      if (
        addr &&
        (addr.line1 || addr.address1) &&
        addr.city &&
        (addr.state || addr.stateProvince) &&
        (addr.postalCode || addr.zip)
      ) {
        sellerAddressOk = true;
        sellerAddressSource = "sellers profile (shippingAddress block)";
      }

      // Check flat address fields from become-a-seller application
      if (!sellerAddressOk) {
        const flatAddress = String(sd.address || "").trim();
        const flatCity = String(sd.city || "").trim();
        const flatState = String(sd.state || "").trim();
        const flatZip = String(sd.zip || "").trim();
        if (flatAddress && flatCity && flatState && flatZip) {
          sellerAddressOk = true;
          sellerAddressSource = "sellers profile (flat address fields)";
        }
      }
    }

    // If sellerId looks like an email and we haven't resolved sellerEmail yet
    if (!sellerEmail && orderSellerId.includes("@")) {
      sellerEmail = orderSellerId.trim().toLowerCase();
    }

    // Check seller_banking (preferred source — overrides profile address)
    if (sellerEmail) {
      const bankDoc = await adminDb
        .collection("seller_banking")
        .doc(sellerEmail)
        .get();
      if (bankDoc.exists) {
        const b: any = bankDoc.data() || {};
        if (b.addressLine1 && b.city && b.state && b.postalCode) {
          sellerAddressOk = true;
          sellerAddressSource = `seller_banking/${sellerEmail}`;
        }
      }
    }
  } catch (e: any) {
    checks.push(
      fail(
        "seller_address",
        "Seller ship-from address readable",
        `Firestore error: ${e?.message || "Unknown"}`
      )
    );
  }

  checks.push(
    sellerAddressOk
      ? pass(
          "seller_address",
          "Seller ship-from address exists",
          `Source: ${sellerAddressSource}`
        )
      : fail(
          "seller_address",
          "Seller ship-from address exists",
          `No complete address found for seller "${orderSellerId}". The seller must complete Banking & Payouts (address).${
            sellerEmail ? ` (checked seller_banking/${sellerEmail} and sellers profile)` : " (could not resolve seller email)"
          }`
        )
  );

  // Seller email check (needed for label email)
  checks.push(
    sellerEmail && sellerEmail.includes("@")
      ? pass(
          "seller_email",
          "Seller email available for notifications",
          `${sellerEmail} (for order seller "${orderSellerId}")`
        )
      : fail(
          "seller_email",
          "Seller email available for notifications",
          `No email found for seller "${orderSellerId}" — label email won't be sent`,
          "warning"
        )
  );

  // ────────────────────────────────────────────
  // 10. UPS API reachability (token test)
  // ────────────────────────────────────────────
  if (has(upsClientId) && has(upsClientSecret)) {
    try {
      const { getUpsAccessToken } = await import("../../../lib/ups");
      const token = await getUpsAccessToken();
      checks.push(
        token
          ? pass(
              "ups_auth",
              "UPS OAuth token obtainable",
              `Token received (${token.slice(0, 8)}…)`
            )
          : fail("ups_auth", "UPS OAuth token obtainable", "Token was empty")
      );
    } catch (e: any) {
      checks.push(
        fail(
          "ups_auth",
          "UPS OAuth token obtainable",
          `Auth failed: ${e?.message || "Unknown error"}`
        )
      );
    }
  } else {
    checks.push(
      fail(
        "ups_auth",
        "UPS OAuth token obtainable",
        "Skipped — UPS_CLIENT_ID or UPS_CLIENT_SECRET missing"
      )
    );
  }

  // ────────────────────────────────────────────
  // 11. Email Outbox events for this order
  // ────────────────────────────────────────────
  try {
    // Query outbox for events related to this order ID
    const outboxSnap = await adminDb
      .collection("email_outbox")
      .where("metadata.orderId", "==", String(orderId))
      .limit(20)
      .get();

    for (const doc of outboxSnap.docs) {
      const d: any = doc.data() || {};
      outbox.push({
        id: doc.id,
        eventType: d.eventType || "",
        status: d.status || "",
        attempts: d.attempts || 0,
        lastError: d.lastError || undefined,
        to: d.to || undefined,
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() || null,
      });
    }

    // Also check by eventKey pattern
    const altSnap = await adminDb
      .collection("email_outbox")
      .where("eventKey", ">=", `ups_label_ready:${String(orderId)}`)
      .where("eventKey", "<=", `ups_label_ready:${String(orderId)}\uf8ff`)
      .limit(10)
      .get();

    const existingIds = new Set(outbox.map((o) => o.id));
    for (const doc of altSnap.docs) {
      if (existingIds.has(doc.id)) continue;
      const d: any = doc.data() || {};
      outbox.push({
        id: doc.id,
        eventType: d.eventType || "",
        status: d.status || "",
        attempts: d.attempts || 0,
        lastError: d.lastError || undefined,
        to: d.to || undefined,
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() || null,
      });
    }

    const labelEmails = outbox.filter(
      (o) => o.eventType === "ups_label_ready"
    );
    const sentLabel = labelEmails.find((o) => o.status === "sent");
    const failedLabel = labelEmails.find(
      (o) => o.status === "failed" || o.status === "dead"
    );

    if (labelEmails.length === 0) {
      checks.push(
        fail(
          "outbox_label_email",
          "Label email queued in outbox",
          "No ups_label_ready email found in outbox for this order",
          "warning"
        )
      );
    } else if (sentLabel) {
      checks.push(
        pass(
          "outbox_label_email",
          "Label email sent successfully",
          `Sent to ${sentLabel.to || "?"}`
        )
      );
    } else if (failedLabel) {
      checks.push(
        fail(
          "outbox_label_email",
          "Label email delivered",
          `Status: ${failedLabel.status}, attempts: ${failedLabel.attempts}, error: ${failedLabel.lastError || "?"}`
        )
      );
    } else {
      checks.push(
        pass(
          "outbox_label_email",
          "Label email queued",
          `Status: ${labelEmails[0].status}, attempts: ${labelEmails[0].attempts}`
        )
      );
    }

    // Check buyer shipping notification
    const buyerEmails = outbox.filter(
      (o) => o.eventType === "buyer_shipping_notification"
    );
    if (buyerEmails.length > 0) {
      const sentBuyer = buyerEmails.find((o) => o.status === "sent");
      checks.push(
        sentBuyer
          ? pass(
              "outbox_buyer_email",
              "Buyer shipping notification sent",
              `Sent to ${sentBuyer.to || "?"}`
            )
          : fail(
              "outbox_buyer_email",
              "Buyer shipping notification sent",
              `Status: ${buyerEmails[0].status}, attempts: ${buyerEmails[0].attempts}`,
              "warning"
            )
      );
    }
  } catch (e: any) {
    checks.push(
      fail(
        "outbox_query",
        "Email outbox queryable",
        `Error querying outbox: ${e?.message || "Unknown"}`,
        "warning"
      )
    );
  }

  // ────────────────────────────────────────────
  // Build recommendations
  // ────────────────────────────────────────────
  const failedChecks = checks.filter(
    (c) => !c.ok && c.severity !== "warning"
  );
  const warningChecks = checks.filter(
    (c) => !c.ok && c.severity === "warning"
  );

  if (failedChecks.length === 0 && warningChecks.length === 0) {
    recommendations.push(
      "All checks passed. If the label still isn't working, try clicking Generate UPS Label on the Orders page."
    );
  }

  for (const c of failedChecks) {
    switch (c.key) {
      case "ups_client_id":
      case "ups_client_secret":
        recommendations.push(
          "Add UPS_CLIENT_ID and UPS_CLIENT_SECRET to Vercel environment variables. These come from your UPS Developer account."
        );
        break;
      case "ups_account":
        recommendations.push(
          "Add UPS_ACCOUNT_NUMBER to Vercel env vars. This is your 6-character UPS shipper number."
        );
        break;
      case "firebase_admin":
        recommendations.push(
          "Set FIREBASE_SERVICE_ACCOUNT_JSON in Vercel env vars with your Firebase service account key JSON."
        );
        break;
      case "storage_bucket":
        recommendations.push(
          "Set FIREBASE_STORAGE_BUCKET in Vercel env vars (e.g. your-project.appspot.com)."
        );
        break;
      case "order_exists":
        recommendations.push(
          "The order was not found. Verify the Order ID is correct."
        );
        break;
      case "order_ownership":
        recommendations.push(
          "This order belongs to a different seller. You can only diagnose your own orders."
        );
        break;
      case "order_paid":
        recommendations.push(
          "The order must be fully paid (PayPal captured) before a shipping label can be generated."
        );
        break;
      case "buyer_address":
        recommendations.push(
          "The buyer's shipping address is missing or incomplete. The buyer must provide a full address at checkout."
        );
        break;
      case "seller_address":
        recommendations.push(
          "Complete your seller address in Banking & Payouts. UPS needs a valid ship-from address."
        );
        break;
      case "ups_auth":
        recommendations.push(
          "UPS OAuth authentication failed. Verify your UPS_CLIENT_ID and UPS_CLIENT_SECRET are correct and not expired."
        );
        break;
      case "outbox_label_email":
        recommendations.push(
          "The label email failed to send. Check AWS SES configuration and try clicking Resend Label Email."
        );
        break;
      case "label_error":
        recommendations.push(
          "A previous label generation attempt failed. Review the error above and fix the underlying issue before retrying."
        );
        break;
    }
  }

  for (const c of warningChecks) {
    switch (c.key) {
      case "ups_base_url":
        recommendations.push(
          "Consider setting UPS_BASE_URL explicitly. Default is https://onlinetools.ups.com."
        );
        break;
      case "seller_email":
        recommendations.push(
          "Add an email to your seller profile so label notifications can be sent to you."
        );
        break;
      case "email_ses":
        recommendations.push(
          "AWS SES credentials are missing. Label emails won't be sent. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
        );
        break;
      case "outbox_label_email":
        if (
          checks.find((ch) => ch.key === "label_already_generated" && !ch.ok)
        ) {
          recommendations.push(
            "No label has been generated yet, so no email was sent. Click Generate UPS Label first."
          );
        }
        break;
    }
  }

  // Deduplicate recommendations
  const uniqueRecs = [...new Set(recommendations)];

  return res.status(200).json({
    ok: true,
    checks,
    recommendations: uniqueRecs,
    order: orderInfo,
    outbox,
  });
}
