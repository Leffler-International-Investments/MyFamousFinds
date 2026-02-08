// FILE: /pages/order/success.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { retrieveCheckoutSession } from "../../lib/stripe";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";
import PostPurchaseButler from "../../components/PostPurchaseButler";

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
    <div className="dark-theme-page">
      <Head>
        <title>Order successful – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Thank you, your order is confirmed.</h1>
        <p className="lead">
          We&apos;ve emailed your receipt and will notify you as soon as your
          seller ships your item.
        </p>

        <div className="summary">
          <h2>Order summary</h2>

          <p className="row">
            <span className="label">Item</span>
            <span className="value">{productTitle}</span>
          </p>

          {brand && (
            <p className="row">
              <span className="label">Brand</span>
              <span className="value">{brand}</span>
            </p>
          )}

          {category && (
            <p className="row">
              <span className="label">Category</span>
              <span className="value">{category}</span>
            </p>
          )}

          <p className="row">
            <span className="label">Total paid</span>
            <span className="value">{formattedTotal}</span>
          </p>

          {orderId && (
            <p className="row">
              <span className="label">Order ID</span>
              <span className="value">{orderId}</span>
            </p>
          )}
        </div>

        <div className="summary">
          <h2>Delivery details</h2>

          {buyerName && (
            <p className="row">
              <span className="label">Name</span>
              <span className="value">{buyerName}</span>
            </p>
          )}

          {buyerEmail && (
            <p className="row">
              <span className="label">Email</span>
              <span className="value">{buyerEmail}</span>
            </p>
          )}

          <p className="row">
            <span className="label">Ship to</span>
            <span className="value address">{shippingAddressText || "Pending"}</span>
          </p>
        </div>

        <p className="authDisclaimer">
          Famous Finds acts solely as a marketplace platform connecting buyers
          and independent sellers. Authenticity of items is the sole
          responsibility of the seller.
        </p>

        <Link href="/" className="back">
          Back to homepage
        </Link>
      </main>

      <PostPurchaseButler
        brand={brand}
        itemTitle={productTitle}
        category={category || "bags"}
        vipUrl={vipUrl}
      />

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 640px;
          margin: 0 auto;
          padding: 32px 16px 80px;
          text-align: center;
        }
        h1 {
          font-size: 26px;
          margin-bottom: 12px;
        }
        .lead {
          font-size: 15px;
          color: #e5e7eb;
          margin-bottom: 20px;
        }
        .summary {
          margin: 16px auto 24px;
          max-width: 480px;
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.25);
          text-align: left;
        }
        h2 {
          margin: 0 0 10px;
          font-size: 15px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin: 8px 0;
          font-size: 13px;
        }
        .label {
          color: #9ca3af;
          min-width: 90px;
        }
        .value {
          color: #fff;
          font-weight: 700;
          text-align: right;
          white-space: pre-line;
        }
        .address {
          max-width: 320px;
        }
        .authDisclaimer {
          font-size: 12px;
          color: #cbd5e1;
          margin-top: 10px;
        }
        .back {
          display: inline-block;
          margin-top: 18px;
          color: #fff;
          text-decoration: underline;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<SuccessProps> = async (
  ctx
) => {
  const sessionId = String(ctx.query.session_id || "");

  if (!sessionId) {
    return { notFound: true };
  }

  try {
    const session = await retrieveCheckoutSession(sessionId);

    const currency = (session.currency || "usd").toUpperCase();
    const amountTotal = (session.amount_total || 0) / 100;

    let productTitle = "Your item";
    let brand = "";
    let category = "";
    let orderId = "";
    let listingId = "";

    if (session.metadata) {
      if (session.metadata.listingId) {
        listingId = session.metadata.listingId;
      }
      if (session.metadata.productTitle) {
        productTitle = session.metadata.productTitle;
      }
      if (session.metadata.brand) {
        brand = session.metadata.brand;
      }
      if (session.metadata.category) {
        category = session.metadata.category;
      }
    }

    let buyerEmail = session.customer_details?.email || "";
    let buyerName = session.customer_details?.name || "";

    const shippingDetails = (session as any).shipping_details as
      | { name?: string; address?: any }
      | undefined;

    const shipAddr =
      shippingDetails?.address || session.customer_details?.address || null;

    if (shippingDetails?.name) {
      buyerName = shippingDetails.name;
    }

    let shippingAddressText = shipAddr
      ? [
          shippingDetails?.name || buyerName,
          shipAddr.line1 || "",
          shipAddr.line2 || "",
          [shipAddr.city, shipAddr.state, shipAddr.postal_code]
            .filter(Boolean)
            .join(" "),
          shipAddr.country || "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    if (adminDb) {
      const ordersSnap = await adminDb
        .collection("orders")
        .where("stripeSessionId", "==", session.id)
        .limit(1)
        .get();
      if (!ordersSnap.empty) {
        const orderDoc = ordersSnap.docs[0];
        const data = orderDoc.data() as any;
        orderId = orderDoc.id;
        productTitle = String(data.listingTitle || productTitle);
        brand = String(data.listingBrand || brand);
        category = String(data.listingCategory || category);
        buyerEmail = String(data.buyerEmail || buyerEmail);
        buyerName = String(data.buyerName || buyerName);
        if (!shippingAddressText && data.shippingAddress) {
          const sa = data.shippingAddress;
          const fallbackText = [
            sa.name || buyerName,
            sa.line1 || "",
            sa.line2 || "",
            [sa.city, sa.state, sa.postal_code].filter(Boolean).join(" "),
            sa.country || "",
          ]
            .filter(Boolean)
            .join("\n");
          if (fallbackText) {
            shippingAddressText = fallbackText;
          }
        }
      }
    }

    // ✅ HARD FALLBACK: ensure listing is marked Sold even if webhook delivery is delayed/missed
    if (adminDb && listingId) {
      try {
        const listingRef = adminDb.collection("listings").doc(String(listingId));
        const listingSnap = await listingRef.get();
        if (listingSnap.exists) {
          const d: any = listingSnap.data() || {};
          const status = String(d.status || "").toLowerCase();
          const isSold = d.isSold === true || d.sold === true || status === "sold";
          if (!isSold) {
            await listingRef.update({
              status: "Sold",
              isSold: true,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      } catch (e) {
        console.warn("success_page_mark_sold_failed", e);
      }
    }

    const vipUrl =
      process.env.NEXT_PUBLIC_VIP_URL ||
      process.env.VIP_URL ||
      "/vip-welcome";

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
  } catch (err) {
    console.error("Error loading Stripe session on success page:", err);
    return { notFound: true };
  }
};
