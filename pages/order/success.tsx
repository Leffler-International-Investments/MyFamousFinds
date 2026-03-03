// FILE: /pages/order/success.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { capturePayPalOrder, getPayPalOrder } from "../../lib/paypal";
import PostPurchaseButler from "../../components/PostPurchaseButler";
import {
  sendBuyerOrderConfirmationEmail,
  sendSellerItemSoldEmail,
} from "../../utils/email";
import { queueEmail } from "../../utils/emailOutbox";
import { tryAutoGenerateLabel } from "../../utils/autoGenerateLabel";

type SuccessProps = {
  productTitle: string;
  brand: string;
  category: string;
  amountTotal: number;
  currency: string;
  vipUrl: string;
  buyerEmail: string;
  buyerName: string;
  shippingAddressText: string;
  orderId: string;
};

export default function OrderSuccessPage({
  productTitle,
  brand,
  category,
  amountTotal,
  currency,
  vipUrl,
  buyerEmail,
  buyerName,
  shippingAddressText,
  orderId,
}: SuccessProps) {
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountTotal);

  return (
    <>
      <div className="dark-theme-page">
        <Head>
          <title>Order successful – Famous Finds</title>
        </Head>
        <Header />

        <main className="wrap">
          <div className="checkmark">&#10003;</div>
          <h1 className="heading">Thank you, your order is confirmed.</h1>
          <p className="lead">
            We&apos;ve emailed your receipt. Your seller will prepare your item for
            shipment and tracking details will be updated in your orders once dispatched.
          </p>

          <div className="card">
            <h2 className="card-title">Order summary</h2>

            <div className="row">
              <span className="label">Status</span>
              <span className="value">
                <span className="status-badge">Ordered &mdash; Shipment pending</span>
              </span>
            </div>

            <div className="row">
              <span className="label">Item</span>
              <span className="value">{productTitle}</span>
            </div>

            {brand ? (
              <div className="row">
                <span className="label">Brand</span>
                <span className="value">{brand}</span>
              </div>
            ) : null}

            {category ? (
              <div className="row">
                <span className="label">Category</span>
                <span className="value">{category}</span>
              </div>
            ) : null}

            <div className="row">
              <span className="label">Total</span>
              <span className="value total">{formattedTotal}</span>
            </div>

            {orderId ? (
              <div className="row">
                <span className="label">Order ID</span>
                <span className="value mono">{orderId}</span>
              </div>
            ) : null}
          </div>

          <div className="card">
            <h2 className="card-title">Delivery details</h2>
            <div className="row">
              <span className="label">Buyer</span>
              <span className="value">
                {buyerName || "—"}
                {buyerEmail ? (
                  <>
                    <br />
                    {buyerEmail}
                  </>
                ) : null}
              </span>
            </div>

            <div className="row">
              <span className="label">Shipping address</span>
              <span className="value" style={{ whiteSpace: "pre-line" }}>
                {shippingAddressText || "—"}
              </span>
            </div>
          </div>

          <div className="actions">
            <Link className="btn-primary" href={vipUrl || "/vip-welcome"}>
              VIP Club / Price Match
            </Link>
            <Link className="btn-secondary" href="/my-orders">
              View My Orders
            </Link>
          </div>
        </main>

        <Footer />

        <style jsx>{`
          .wrap {
            max-width: 620px;
            margin: 0 auto;
            padding: 40px 20px 60px;
            text-align: center;
          }
          .checkmark {
            width: 56px;
            height: 56px;
            margin: 0 auto 18px;
            background: #16a34a;
            color: #fff;
            font-size: 28px;
            font-weight: 700;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .heading {
            font-size: 26px;
            font-weight: 800;
            color: #111;
            margin: 0 0 8px;
          }
          .lead {
            font-size: 14px;
            color: #555;
            margin: 0 0 28px;
            line-height: 1.5;
          }
          .card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 20px 22px;
            margin-bottom: 16px;
            text-align: left;
          }
          .card-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #111;
            margin: 0 0 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f0f0f0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 8px 0;
            gap: 12px;
          }
          .row + .row {
            border-top: 1px solid #f5f5f5;
          }
          .label {
            font-size: 13px;
            color: #888;
            font-weight: 500;
            min-width: 110px;
            flex-shrink: 0;
          }
          .value {
            font-size: 13px;
            color: #111;
            font-weight: 600;
            text-align: right;
          }
          .total {
            font-size: 16px;
            font-weight: 800;
            color: #111;
          }
          .mono {
            font-family: monospace;
            font-size: 11px;
            word-break: break-all;
          }
          .status-badge {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 999px;
            letter-spacing: 0.02em;
          }
          .actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
            justify-content: center;
          }
          .actions :global(.btn-primary) {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #111;
            color: #fff;
            border: none;
            border-radius: 999px;
            padding: 12px 20px;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
          }
          .actions :global(.btn-secondary) {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            color: #111;
            border: 1px solid #ddd;
            border-radius: 999px;
            padding: 12px 20px;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
          }
          @media (max-width: 600px) {
            .wrap {
              padding: 28px 16px 48px;
            }
            .heading {
              font-size: 22px;
            }
            .actions {
              flex-direction: column;
            }
          }
        `}</style>
      </div>

      {/* Butler rendered outside dark-theme-page so global color override doesn't affect it */}
      <PostPurchaseButler
        brand={brand || ""}
        itemTitle={productTitle || ""}
        category={category || ""}
        vipUrl={vipUrl || "/vip-welcome"}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<SuccessProps> = async (ctx) => {
  // PayPal appends ?token=ORDER_ID&PayerID=... to the return URL automatically
  const paypalOrderId = String(ctx.query.token || ctx.query.paypal_order_id || "");
  const pendingId = String(ctx.query.pending || "");

  if (!paypalOrderId) return { notFound: true };

  try {
    if (!adminDb) return { notFound: true };

    // First, try to capture the order if it hasn't been captured yet
    const existingOrder = await adminDb
      .collection("orders")
      .where("paypalOrderId", "==", paypalOrderId)
      .limit(1)
      .get();

    let orderId = "";
    let productTitle = "Your item";
    let brand = "";
    let category = "";
    let amountTotal = 0;
    let currency = "USD";
    let buyerEmail = "";
    let buyerName = "";
    let shippingAddressText = "";

    if (!existingOrder.empty) {
      // Order already captured (e.g. webhook beat us) — read from Firestore
      const orderDoc = existingOrder.docs[0];
      const data = orderDoc.data() as any;
      orderId = orderDoc.id;
      productTitle = String(data.listingTitle || productTitle);
      brand = String(data.listingBrand || brand);
      category = String(data.listingCategory || category);
      amountTotal = Number(data.amountTotal || 0) / 100;
      currency = String(data.currency || "USD");
      buyerEmail = String(data.buyerEmail || "");
      buyerName = String(data.buyerName || "");

      if (data.shippingAddress) {
        const sa = data.shippingAddress;
        shippingAddressText = [
          sa.name || buyerName,
          sa.line1 || "",
          sa.line2 || "",
          [sa.city, sa.state, sa.postal_code].filter(Boolean).join(" "),
          sa.country || "",
        ]
          .filter(Boolean)
          .join("\n");
      }

      // ── Enrich webhook-created order with pending data + ensure emails sent ──
      // When the PayPal webhook creates the order before this page loads,
      // buyer details may be incomplete and confirmation emails may not
      // have been sent. Load the pending order and fill in any gaps.
      let pendingData: any = {};
      if (pendingId) {
        try {
          const pendingSnap = await adminDb
            .collection("pending_orders")
            .doc(pendingId)
            .get();
          if (pendingSnap.exists) {
            pendingData = pendingSnap.data() || {};
          }
        } catch {}
      }

      // Enrich order with buyer details from pending order if missing
      const enrichUpdates: Record<string, any> = {};
      if (!buyerEmail && pendingData.buyerDetails?.email) {
        buyerEmail = String(pendingData.buyerDetails.email).trim().toLowerCase();
        enrichUpdates.buyerEmail = buyerEmail;
      }
      if (!buyerName && pendingData.buyerDetails?.fullName) {
        buyerName = String(pendingData.buyerDetails.fullName).trim();
        enrichUpdates.buyerName = buyerName;
      }
      if (!data.shippingAddress && pendingData.buyerDetails) {
        const bd = pendingData.buyerDetails;
        if (bd.addressLine1 && bd.city && bd.state && bd.postalCode) {
          enrichUpdates.shippingAddress = {
            name: bd.fullName || "",
            line1: bd.addressLine1 || "",
            line2: bd.addressLine2 || "",
            city: bd.city || "",
            state: bd.state || "",
            postal_code: bd.postalCode || "",
            country: bd.country || "",
          };
        }
      }
      if (!data.listingTitle && pendingData.productTitle) {
        productTitle = pendingData.productTitle;
        enrichUpdates.listingTitle = productTitle;
      }
      if (data.source === "webhook") {
        enrichUpdates.source = "capture";
      }
      if (pendingData.buyerId && !data.buyerId) {
        enrichUpdates.buyerId = pendingData.buyerId;
      }

      if (Object.keys(enrichUpdates).length > 0) {
        try {
          await adminDb.collection("orders").doc(orderId).update(enrichUpdates);
        } catch (updateErr) {
          console.error("[order/success] Failed to enrich existing order:", updateErr);
        }
      }

      // Send buyer confirmation email if not already attempted.
      // The webhook sends this fire-and-forget which can fail silently,
      // so we attempt it here as well to ensure delivery.
      if (buyerEmail && !data.buyerConfirmationEmailAttempted) {
        try {
          await adminDb.collection("orders").doc(orderId).update({
            buyerConfirmationEmailAttempted: true,
          });
          const emailAmountStr = amountTotal.toFixed(2);
          const emailItemTitle = pendingData.productTitle || productTitle;
          await sendBuyerOrderConfirmationEmail({
            to: buyerEmail,
            buyerName: buyerName || undefined,
            orderId,
            itemTitle: emailItemTitle,
            amount: emailAmountStr,
            currency,
          });
          console.log(`[order/success] Buyer confirmation email sent for existing order ${orderId}`);
        } catch (emailErr) {
          console.error("[order/success] Buyer email for existing order failed, queueing:", emailErr);
          const emailAmountStr = amountTotal.toFixed(2);
          const emailItemTitle = pendingData.productTitle || productTitle;
          await queueEmail({
            to: buyerEmail,
            subject: "MyFamousFinds — Order Confirmation",
            text:
              `Hello ${buyerName || "there"},\n\n` +
              `Thank you for your purchase on MyFamousFinds!\n\n` +
              `Order ID: ${orderId}\nItem: ${emailItemTitle}\nTotal: ${currency} ${emailAmountStr}\n\n` +
              `We will process your order and keep you updated on shipping.\n\n` +
              `Regards,\nThe MyFamousFinds Team\n`,
            eventType: "buyer_order_confirmation",
            eventKey: `${orderId}:buyer_order_confirmation`,
            metadata: { orderId, buyerEmail },
          }).catch((qErr) => console.error("[order/success] Outbox queue failed:", qErr));
        }
      }

      // Clean up pending order
      if (pendingId) {
        await adminDb
          .collection("pending_orders")
          .doc(pendingId)
          .delete()
          .catch(() => {});
      }

      // Try label generation (idempotent — skips if label already exists)
      try {
        await tryAutoGenerateLabel(orderId);
      } catch (labelErr) {
        console.error("[order/success] Label generation for existing order failed:", labelErr);
      }
    } else {
      // Try to capture the PayPal order directly.
      // If capture fails (e.g. already captured), fall back to reading the order.
      let orderResult: any = null;

      try {
        orderResult = await capturePayPalOrder(paypalOrderId);
      } catch (captureErr: any) {
        console.error("PayPal capture attempt failed, trying getPayPalOrder:", captureErr?.message);
        // Order may already be captured — fetch its current state instead
        try {
          orderResult = await getPayPalOrder(paypalOrderId);
        } catch (getErr: any) {
          console.error("PayPal getOrder also failed:", getErr?.message);
        }
      }

      if (orderResult) {
        const orderStatus = orderResult.status;

        // Accept COMPLETED (captured) or APPROVED (buyer approved, auto-captured)
        if (orderStatus === "COMPLETED" || orderStatus === "APPROVED") {
          const purchaseUnit = orderResult.purchase_units?.[0];
          const capture = purchaseUnit?.payments?.captures?.[0];
          const captureId = capture?.id || "";
          const listingId =
            purchaseUnit?.reference_id || purchaseUnit?.custom_id || "";

          // Load pending order details
          let pendingData: any = {};
          if (pendingId) {
            const pendingSnap = await adminDb
              .collection("pending_orders")
              .doc(pendingId)
              .get();
            if (pendingSnap.exists) {
              pendingData = pendingSnap.data() || {};
            }
          }

          // If no listingId from PayPal, try from pending order
          const resolvedListingId = listingId || pendingData.listingId || "";

          // Load listing to get sellerId
          let sellerId = "";
          if (resolvedListingId) {
            const listingSnap = await adminDb
              .collection("listings")
              .doc(String(resolvedListingId))
              .get();
            if (listingSnap.exists) {
              const listing: any = listingSnap.data() || {};
              sellerId = String(
                listing.sellerId || listing.sellerEmail || listing.seller || ""
              );
            }
          }

          // Extract payer info
          const payer = orderResult.payer || {};
          const payerEmail =
            payer.email_address || pendingData.buyerDetails?.email || "";
          const payerName =
            [payer.name?.given_name, payer.name?.surname]
              .filter(Boolean)
              .join(" ") ||
            pendingData.buyerDetails?.fullName ||
            "";

          const shipping = purchaseUnit?.shipping;
          const shippingAddress = shipping?.address
            ? {
                name: shipping.name?.full_name || payerName,
                line1: shipping.address.address_line_1 || "",
                line2: shipping.address.address_line_2 || "",
                city: shipping.address.admin_area_2 || "",
                state: shipping.address.admin_area_1 || "",
                postal_code: shipping.address.postal_code || "",
                country: shipping.address.country_code || "",
              }
            : pendingData.buyerDetails
            ? {
                name: pendingData.buyerDetails.fullName || "",
                line1: pendingData.buyerDetails.addressLine1 || "",
                line2: pendingData.buyerDetails.addressLine2 || "",
                city: pendingData.buyerDetails.city || "",
                state: pendingData.buyerDetails.state || "",
                postal_code: pendingData.buyerDetails.postalCode || "",
                country: pendingData.buyerDetails.country || "",
              }
            : null;

          // Get amount from capture or from purchase unit or from pending order
          const capturedAmount =
            Number(capture?.amount?.value || 0) ||
            Number(purchaseUnit?.amount?.value || 0) ||
            Number(pendingData.listingPrice || 0);
          const capturedCurrency =
            capture?.amount?.currency_code ||
            purchaseUnit?.amount?.currency_code ||
            pendingData.currency ||
            "USD";

          // Re-check for existing order (webhook may have created one during capture)
          const recheck = await adminDb
            .collection("orders")
            .where("paypalOrderId", "==", paypalOrderId)
            .limit(1)
            .get();

          let orderRef: { id: string };
          if (!recheck.empty) {
            // Webhook beat us — use the existing order and enrich it
            orderRef = recheck.docs[0].ref as any;
            await adminDb.collection("orders").doc(recheck.docs[0].id).update({
              paypalCaptureId: captureId,
              buyerEmail: payerEmail,
              buyerName: payerName,
              listingTitle: pendingData.productTitle || recheck.docs[0].data()?.listingTitle || "",
              listingBrand: pendingData.brand || "",
              listingCategory: pendingData.category || "",
              shippingAddress,
              ...(pendingData.buyerId ? { buyerId: pendingData.buyerId } : {}),
              source: "capture",
            });
            orderRef = { id: recheck.docs[0].id };
          } else {
            // Create order in Firestore
            const newRef = await adminDb.collection("orders").add({
              paypalOrderId,
              paypalCaptureId: captureId,
              listingId: resolvedListingId,
              ...(sellerId ? { sellerId } : {}),
              buyerEmail: payerEmail,
              buyerName: payerName,
              listingTitle: pendingData.productTitle || "",
              listingBrand: pendingData.brand || "",
              listingCategory: pendingData.category || "",
              amountTotal: Math.round(capturedAmount * 100),
              currency: capturedCurrency,
              status: "paid",
              createdAt: Date.now(),
              shippingAddress,
              ...(pendingData.buyerId ? { buyerId: pendingData.buyerId } : {}),
            });
            orderRef = newRef;
          }

          // Mark listing as sold
          if (resolvedListingId) {
            await adminDb
              .collection("listings")
              .doc(String(resolvedListingId))
              .update({
                status: "Sold",
                isSold: true,
                soldAt: Date.now(),
              })
              .catch((e: any) =>
                console.error("Failed to mark listing as sold:", e?.message)
              );
          }

          // Clean up pending order
          if (pendingId) {
            await adminDb
              .collection("pending_orders")
              .doc(pendingId)
              .delete()
              .catch(() => {});
          }

          // ── Send confirmation emails ──
          const emailOrderId = orderRef.id;
          const emailItemTitle = pendingData.productTitle || "Item";
          const emailAmountStr = capturedAmount.toFixed(2);

          // Buyer confirmation email
          if (payerEmail) {
            try {
              await adminDb.collection("orders").doc(emailOrderId).update({
                buyerConfirmationEmailAttempted: true,
              });
              await sendBuyerOrderConfirmationEmail({
                to: payerEmail,
                buyerName: payerName || undefined,
                orderId: emailOrderId,
                itemTitle: emailItemTitle,
                amount: emailAmountStr,
                currency: capturedCurrency,
              });
              console.log(`[order/success] Buyer confirmation email sent for order ${emailOrderId}`);
            } catch (emailErr) {
              console.error("[order/success] Buyer email failed, queueing:", emailErr);
              await queueEmail({
                to: payerEmail,
                subject: "MyFamousFinds — Order Confirmation",
                text:
                  `Hello ${payerName || "there"},\n\n` +
                  `Thank you for your purchase on MyFamousFinds!\n\n` +
                  `Order ID: ${emailOrderId}\nItem: ${emailItemTitle}\nTotal: ${capturedCurrency} ${emailAmountStr}\n\n` +
                  `We will process your order and keep you updated on shipping.\n\n` +
                  `Regards,\nThe MyFamousFinds Team\n`,
                eventType: "buyer_order_confirmation",
                eventKey: `${emailOrderId}:buyer_order_confirmation`,
                metadata: { orderId: emailOrderId, buyerEmail: payerEmail },
              }).catch((qErr) => console.error("[order/success] Outbox queue failed:", qErr));
            }
          }

          // Seller notification email
          if (sellerId) {
            try {
              let sellerEmail = "";
              let sellerName = "";
              let sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
              if (!sellerDoc.exists) {
                const byEmail = await adminDb.collection("sellers").where("email", "==", sellerId).limit(1).get();
                if (!byEmail.empty) sellerDoc = byEmail.docs[0];
              }
              if (!sellerDoc.exists) {
                const byContact = await adminDb.collection("sellers").where("contactEmail", "==", sellerId).limit(1).get();
                if (!byContact.empty) sellerDoc = byContact.docs[0];
              }
              const sellerData = sellerDoc.exists ? sellerDoc.data() || {} : {};
              sellerEmail = String(sellerData.contactEmail || sellerData.email || sellerId);
              sellerName = String(sellerData.businessName || sellerData.name || "");

              if (sellerEmail && sellerEmail.includes("@")) {
                try {
                  await sendSellerItemSoldEmail({
                    to: sellerEmail,
                    sellerName,
                    itemTitle: emailItemTitle,
                    amount: emailAmountStr,
                    currency: capturedCurrency,
                    orderId: emailOrderId,
                  });
                } catch (sellEmailErr) {
                  console.error("[order/success] Seller email failed, queueing:", sellEmailErr);
                  await queueEmail({
                    to: sellerEmail,
                    subject: "MyFamousFinds — Your Item Has Been Sold!",
                    text:
                      `Hello ${sellerName || "Seller"},\n\n` +
                      `Great news — your item has been sold on MyFamousFinds!\n\n` +
                      `Item: ${emailItemTitle}\nSale Amount: ${capturedCurrency} ${emailAmountStr}\nOrder ID: ${emailOrderId}\n\n` +
                      `Please prepare the item for shipping.\n\n` +
                      `Regards,\nThe MyFamousFinds Team\n`,
                    eventType: "seller_item_sold",
                    eventKey: `${emailOrderId}:seller_item_sold:${sellerId}`,
                    metadata: { orderId: emailOrderId, sellerId, sellerEmail, itemTitle: emailItemTitle },
                  }).catch((qErr) => console.error("[order/success] Seller outbox queue failed:", qErr));
                }
              }
            } catch (sellerLookupErr) {
              console.error("[order/success] Seller lookup for email failed:", sellerLookupErr);
            }
          }

          // Populate success page data
          orderId = orderRef.id;
          productTitle = pendingData.productTitle || productTitle;
          brand = pendingData.brand || brand;
          category = pendingData.category || category;
          amountTotal = capturedAmount;
          currency = capturedCurrency;
          buyerEmail = payerEmail;
          buyerName = payerName;

          if (shippingAddress) {
            shippingAddressText = [
              shippingAddress.name || payerName,
              shippingAddress.line1 || "",
              shippingAddress.line2 || "",
              [shippingAddress.city, shippingAddress.state, shippingAddress.postal_code]
                .filter(Boolean)
                .join(" "),
              shippingAddress.country || "",
            ]
              .filter(Boolean)
              .join("\n");
          }
        }
      }
    }

    const vipUrl = process.env.NEXT_PUBLIC_VIP_URL || "/vip-welcome";

    return {
      props: {
        productTitle,
        brand,
        category,
        amountTotal,
        currency,
        vipUrl,
        buyerEmail,
        buyerName,
        shippingAddressText,
        orderId,
      },
    };
  } catch (err: any) {
    console.error("order_success_ssr_error", err?.message || err);
    return { notFound: true };
  }
};
