// FILE: /pages/product/[id].tsx
import React, { useState } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getStripe } from "../../lib/getStripe";
import { adminDb } from "../../utils/firebaseAdmin";

type ProductPageProps = {
  id: string;
  title: string;
  price: number;
  currency: string;
  priceLabel: string;
  imageUrl: string;
  description: string;
  sellerName: string;
  delivery: string;
  payment: string;
};

export default function ProductPage({
  id,
  title,
  price,
  currency,
  priceLabel,
  imageUrl,
  description,
  sellerName,
  delivery,
  payment,
}: ProductPageProps) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [showThanks, setShowThanks] = useState(false);

  async function handleBuyNow() {
    if (!price) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout?id=${encodeURIComponent(id)}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json?.sessionId) {
        throw new Error(json?.error || "Checkout failed");
      }
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Stripe not loaded");
      }
      await stripe.redirectToCheckout({ sessionId: json.sessionId });
    } catch (err) {
      console.error(err);
      alert("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  function handleRating(value: number) {
    setRating(value);
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 2000);
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>{title} – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <div className="layout">
          <div className="imageBox">
            <img src={imageUrl} alt={title} />
          </div>

          <div className="infoBox">
            <p className="eyebrow">FAMOUS FINDS / CURATED MARKETPLACE</p>
            <h1>{title}</h1>
            {sellerName && (
              <p className="sub">
                Listed by <strong>{sellerName}</strong>
              </p>
            )}

            {priceLabel && (
              <div className="priceRow">
                <span className="price">{priceLabel}</span>
                <span className="priceSub">All prices in {currency}</span>
              </div>
            )}

            {description && (
              <p className="desc">
                {description}
              </p>
            )}

            <div className="meta">
              <div>
                <p className="metaLabel">Delivery</p>
                <p className="metaValue">
                  {delivery || "Tracked, insured shipping arranged with seller."}
                </p>
              </div>
              <div>
                <p className="metaLabel">Payment</p>
                <p className="metaValue">
                  {payment ||
                    "Secure payments handled by Stripe. Major cards and wallets accepted."}
                </p>
              </div>
            </div>

            <button
              className="buy"
              onClick={handleBuyNow}
              disabled={loading || !price}
            >
              {loading ? "Processing..." : "Buy now"}
            </button>

            <p className="authDisclaimer">
              <strong>Disclaimer:</strong> Famous Finds operates as a peer-to-peer
              marketplace. Each listing is uploaded by an independent seller. While we
              apply authenticity review measures, Famous Finds does not guarantee the
              authenticity of any individual item. In case of a dispute, legal
              responsibility rests solely with the seller.
            </p>

            <div className="rating">
              <p className="ratingLabel">
                Rate this item{" "}
                <span className="text-gray-500">(private signal to our team)</span>
              </p>
              <div>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="star"
                    type="button"
                    onClick={() => handleRating(star)}
                  >
                    {rating && star <= rating ? "★" : "☆"}
                  </button>
                ))}
              </div>
              {showThanks && (
                <p className="ratingThanks">Thanks, your signal has been noted.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
          gap: 36px;
        }
        .imageBox {
          border-radius: 24px;
          overflow: hidden;
          background: #020617;
          border: 1px solid #111827;
        }
        .imageBox img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .infoBox {
          padding: 8px 4px;
        }
        .eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
        }
        h1 {
          margin-top: 4px;
          font-size: 26px;
          letter-spacing: 0.02em;
        }
        .sub {
          font-size: 13px;
          color: #d1d5db;
        }
        .priceRow {
          margin-top: 16px;
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .price {
          font-size: 24px;
          font-weight: 600;
        }
        .priceSub {
          font-size: 12px;
          color: #9ca3af;
        }
        .desc {
          margin-top: 16px;
          font-size: 14px;
          color: #e5e7eb;
          line-height: 1.6;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }
        .metaLabel {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
        }
        .metaValue {
          font-size: 13px;
          color: #e5e7eb;
        }
        .buy {
          margin-top: 18px;
          border-radius: 999px;
          padding: 10px 24px;
          border: none;
          background: #ffffff;
          color: #000;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .buy:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .rating {
          margin-top: 18px;
          font-size: 13px;
        }
        .authDisclaimer {
          margin-top: 10px;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.4;
        }
        .ratingLabel {
          color: #d1d5db;
        }
        .ratingThanks {
          color: #a3e635;
          font-size: 12px;
        }
        .star {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: #4b5563;
        }
        .star:hover {
          color: #e5e7eb;
        }
        @media (max-width: 900px) {
          .layout {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  try {
    const id = ctx.params?.id as string;
    if (!id) return { notFound: true };

    const snap = await adminDb.collection("listings").doc(id).get();
    if (!snap.exists) {
      return { notFound: true };
    }

    const d: any = snap.data() || {};
    const priceNumber = Number(d.price) || 0;
    const currency = d.currency || "AUD";
    const priceLabel = priceNumber
      ? new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(priceNumber)
      : "";

    const sellerName =
      d.sellerName || d.sellerDisplayName || "Independent seller";

    return {
      props: {
        id,
        title: d.title || "Untitled listing",
        price: priceNumber,
        currency,
        priceLabel,
        imageUrl:
          d.imageUrl ||
          "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80",
        description: d.description || "",
        sellerName,
        delivery: d.delivery || "",
        payment: d.payment || "",
      },
    };
  } catch (err) {
    console.error("Error loading product", err);
    return { notFound: true };
  }
};
