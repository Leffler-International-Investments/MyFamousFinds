// FILE: pages/order/success.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { stripe } from "../../lib/stripe";
import { adminDb } from "../../utils/firebaseAdmin";
import PostPurchaseButler from "../../components/PostPurchaseButler";

type SuccessProps = {
  productTitle: string;
  brand: string;
  category: string;
  amountTotal: number;
  currency: string;
  vipUrl: string;
};

export default function OrderSuccessPage({
  productTitle,
  brand,
  category,
  amountTotal,
  currency,
  vipUrl,
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
        <h1>Thank you for your purchase</h1>
        <p className="lead">
          Your payment was successful and your order has been placed with the seller.
          A detailed receipt has been emailed to you.
        </p>

        <div className="summary">
          <h2>Order summary</h2>
          <p className="row">
            <span className="label">Item</span>
            <span className="value">
              {brand && <strong>{brand} — </strong>}
              {productTitle}
            </span>
          </p>
          <p className="row">
            <span className="label">Total paid</span>
            <span className="value">{formattedTotal}</span>
          </p>
        </div>

        <p className="authDisclaimer">
          Famous Finds acts solely as a marketplace platform connecting buyers and
          independent sellers. Authenticity of items is the sole responsibility of
          the seller.
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
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid #1f2937;
          text-align: left;
          font-size: 14px;
        }
        .summary h2 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
          margin-bottom: 6px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 6px;
        }
        .label {
          color: #9ca3af;
        }
        .value {
          font-weight: 500;
          text-align: right;
        }
        .authDisclaimer {
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.5;
          margin-bottom: 28px;
        }
        .back {
          display: inline-block;
          padding: 10px 18px;
          border-radius: 999px;
          background: #ffffff;
          color: #000000;
          text-decoration: none;
          font-weight: 600;
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
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const currency = (session.currency || "usd").toUpperCase();
    const amountTotal = (session.amount_total || 0) / 100;

    let productTitle = "Your item";
    let brand = "";
    let category = "";

    const listingId =
      (session.metadata && (session.metadata as any).listingId) || null;

    if (listingId) {
      const snap = await adminDb.collection("listings").doc(listingId).get();
      if (snap.exists) {
        const data = snap.data() || {};
        productTitle = data.title || productTitle;
        brand = data.brand || "";
        category = data.category || "";
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
      },
    };
  } catch (err) {
    console.error("Error loading Stripe session on success page:", err);
    return { notFound: true };
  }
};
