// FILE: /pages/order/success.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
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
            We&apos;ve emailed your receipt and will notify you as soon as your seller
            ships your item.
          </p>

          <div className="card">
            <h2 className="card-title">Order summary</h2>

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
      // Order already captured — read from Firestore
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
    } else {
      // Need to capture the PayPal order
      const siteUrl =
        (process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
        "https://www.myfamousfinds.com";

      const captureRes = await fetch(`${siteUrl}/api/paypal/capture-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalOrderId, pendingOrderId: pendingId }),
      });

      const captureData = await captureRes.json();

      if (captureData.ok && captureData.orderId) {
        // Re-read the created order
        const orderDoc = await adminDb
          .collection("orders")
          .doc(captureData.orderId)
          .get();

        if (orderDoc.exists) {
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
        }
      }
    }

    const vipUrl = process.env.NEXT_PUBLIC_VIP_URL || process.env.VIP_URL || "/vip-welcome";

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
