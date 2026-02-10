// FILE: /pages/order/success.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { retrieveCheckoutSession } from "../../lib/stripe";
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
    <div className="dark-theme-page">
      <Head>
        <title>Order successful – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Thank you, your order is confirmed.</h1>
        <p className="lead">
          We&apos;ve emailed your receipt and will notify you as soon as your seller
          ships your item.
        </p>

        <div className="summary">
          <h2>Order summary</h2>

          <p className="row">
            <span className="label">Item</span>
            <span className="value">{productTitle}</span>
          </p>

          {brand ? (
            <p className="row">
              <span className="label">Brand</span>
              <span className="value">{brand}</span>
            </p>
          ) : null}

          {category ? (
            <p className="row">
              <span className="label">Category</span>
              <span className="value">{category}</span>
            </p>
          ) : null}

          <p className="row">
            <span className="label">Total</span>
            <span className="value">{formattedTotal}</span>
          </p>

          {orderId ? (
            <p className="row">
              <span className="label">Order ID</span>
              <span className="value">{orderId}</span>
            </p>
          ) : null}
        </div>

        <div className="summary">
          <h2>Delivery details</h2>
          <p className="row">
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
          </p>

          <p className="row">
            <span className="label">Shipping address</span>
            <span className="value" style={{ whiteSpace: "pre-line" }}>
              {shippingAddressText || "—"}
            </span>
          </p>
        </div>

        <div style={{ marginTop: 18 }}>
          <PostPurchaseButler
            brand={brand || ""}
            itemTitle={productTitle || ""}
            category={category || ""}
            vipUrl={vipUrl || "/vip-welcome"}
          />
        </div>

        <div className="actions" style={{ marginTop: 22 }}>
          <Link className="btn" href={vipUrl || "/vip-welcome"}>
            VIP Club / Price Match
          </Link>
          <Link className="btn secondary" href="/my-orders">
            View My Orders
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<SuccessProps> = async (ctx) => {
  const sessionId = String(ctx.query.session_id || "");
  if (!sessionId) return { notFound: true };

  try {
    const session = await retrieveCheckoutSession(sessionId);

    const currency = (session.currency || "usd").toUpperCase();
    const amountTotal = (session.amount_total || 0) / 100;

    let productTitle = "Your item";
    let brand = "";
    let category = "";
    let orderId = "";

    if (session.metadata) {
      if (session.metadata.productTitle) productTitle = session.metadata.productTitle;
      if (session.metadata.brand) brand = session.metadata.brand;
      if (session.metadata.category) category = session.metadata.category;
    }

    let buyerEmail = session.customer_details?.email || "";
    let buyerName = session.customer_details?.name || "";

    const shippingDetails = (session as any).shipping_details as
      | { name?: string; address?: any }
      | undefined;

    const shipAddr = shippingDetails?.address || session.customer_details?.address || null;

    if (shippingDetails?.name) buyerName = shippingDetails.name;

    let shippingAddressText = shipAddr
      ? [
          shippingDetails?.name || buyerName,
          shipAddr.line1 || "",
          shipAddr.line2 || "",
          [shipAddr.city, shipAddr.state, shipAddr.postal_code].filter(Boolean).join(" "),
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
          if (fallbackText) shippingAddressText = fallbackText;
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
