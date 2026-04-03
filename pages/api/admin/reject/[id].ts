// FILE: /pages/api/admin/reject/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";
import { queueEmail } from "../../../../utils/emailOutbox";
import { requireAdmin } from "../../../../utils/adminAuth";
import { brandedEmailWrapper, escapeHtml, normalizeAdminEmail } from "../../../../utils/email";

function catalogueListingUrl(req: NextApiRequest, listingId: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `https://${req.headers.host ?? "myfamousfinds.com"}`;
  return `${baseUrl}/seller/catalogue#listing-${listingId}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  if (!adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing listing id" });
  }

  try {
    const ref = adminDb.collection("listings").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listing = snap.data() || {};
    const { reason } = (req.body || {}) as { reason?: string };

    await ref.update({
      status: "Rejected",
      rejectedAt: new Date(),
      rejectionReason: typeof reason === "string" ? reason : null,
    });

    // Look up seller email to send notification
    const sellerId = String(listing.sellerId || listing.sellerEmail || listing.seller || "");
    const itemTitle = String(listing.title || "Untitled listing");
    let sellerEmail = "";
    let sellerName = "";

    if (sellerId) {
      try {
        let sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
        if (!sellerDoc.exists) {
          const byEmail = await adminDb.collection("sellers").where("email", "==", sellerId).limit(1).get();
          if (!byEmail.empty) sellerDoc = byEmail.docs[0];
        }
        if (!sellerDoc.exists) {
          const byContact = await adminDb.collection("sellers").where("contactEmail", "==", sellerId).limit(1).get();
          if (!byContact.empty) sellerDoc = byContact.docs[0];
        }
        if (sellerDoc.exists) {
          const sellerData = sellerDoc.data() || {};
          sellerEmail = String(sellerData.contactEmail || sellerData.email || "");
          sellerName = String(sellerData.businessName || sellerData.contactName || sellerData.displayName || "");
        } else if (sellerId.includes("@")) {
          sellerEmail = sellerId;
        }
      } catch (err) {
        console.error("[reject-listing] Seller lookup failed:", err);
        if (sellerId.includes("@")) sellerEmail = sellerId;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    let emailQueued = false;

    if (sellerEmail && sellerEmail.includes("@")) {
      const reasonText = typeof reason === "string" && reason ? reason : "Not specified";
      const greetingName = sellerName ? ` ${escapeHtml(sellerName)}` : "";
      const listingLink = catalogueListingUrl(req, id);

      const bodyHtml =
        `<p style="margin:0 0 16px 0;font-size:16px;">Hello${greetingName},</p>` +
        `<p style="margin:0 0 12px 0;">We have reviewed your listing <b>"${escapeHtml(itemTitle)}"</b> and unfortunately we are unable to approve it at this time.</p>` +
        `<p style="margin:0 0 12px 0;"><b>Reason:</b> ${escapeHtml(reasonText)}</p>` +
        `<p style="margin:0 0 12px 0;">Please update the listing to address the issue above and resubmit it for review.</p>` +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;"><tr><td style="border-radius:6px;background-color:#1c1917;">` +
        `<a href="${escapeHtml(listingLink)}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">UPDATE YOUR LISTING</a>` +
        `</td></tr></table>` +
        `<p style="margin:0 0 0 0;font-size:14px;color:#78716c;">Thank you,<br/>The Famous Finds Team</p>`;

      const html = brandedEmailWrapper(bodyHtml);

      const jobId = await queueEmail({
        to: sellerEmail,
        subject: `Famous Finds — Listing Rejected: ${itemTitle}`,
        text: `Hello${sellerName ? " " + sellerName : ""},\n\nWe have reviewed your listing "${itemTitle}" and unfortunately we are unable to approve it at this time.\n\nReason: ${reasonText}\n\nPlease update the listing to address the issue above and resubmit it for review.\n\nUpdate your listing: ${listingLink}\n\nThank you,\nThe Famous Finds Team`,
        html,
        eventType: "listing_rejected",
        eventKey: `${id}:listing_rejected:${today}`,
        metadata: { listingId: id, sellerId, sellerEmail, itemTitle, reason, listingLink },
      });
      emailQueued = !!jobId;
      console.log(`[REJECT-LISTING] Email queued for ${sellerEmail} (listing ${id}), jobId: ${jobId}`);
    } else {
      console.warn(`[REJECT-LISTING] No seller email found for listing ${id} — skipping email`);
    }

    // Internal admin notification
    const adminRecipients = String(
      process.env.ADMIN_NOTIFICATION_EMAILS || process.env.ADMIN_EMAIL || "admin@myfamousfinds.com"
    ).split(",").map((v) => normalizeAdminEmail(v)).filter((v) => v.includes("@"));
    const adminTo = adminRecipients.join(",");

    if (adminTo) {
      await queueEmail({
        to: adminTo,
        subject: `Famous Finds — Listing Rejected: ${itemTitle}`,
        text: `Listing rejected in review queue.\n\nListing: ${itemTitle}\nListing ID: ${id}\nSeller: ${sellerName || "N/A"} (${sellerEmail || "N/A"})\nReason: ${typeof reason === "string" && reason ? reason : "N/A"}`,
        eventType: "listing_rejected_internal_notice",
        eventKey: `${id}:listing_rejected_internal_notice:${today}`,
        metadata: { listingId: id, sellerId, sellerEmail, reason },
      });
    }

    return res.status(200).json({ ok: true, emailQueued });
  } catch (err: any) {
    console.error("Reject listing error", err);
    return res
      .status(500)
      .json({ error: err?.message || "Failed to reject item" });
  }
}
