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
  sellerName?: string;
  delivery?: string;
  payment?: string;
};

export default function ProductDetail(props: ProductPageProps) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [rated, setRated] = useState(false);

  const {
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
  } = props;

  const handleBuyNow = async () => {
    if (!price) return;
    try {
      setLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title,
          price,
          currency,
          image: imageUrl,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to create checkout");

      const stripe = await getStripe();
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: json.sessionId });
      } else {
        throw new Error("Stripe not available");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Something went wrong, please try again.");
      setLoading(false);
    }
  };

  const handleRate = (value: number) => {
    setRating(value);
    setRated(true);
  };

  return (
    <div className="dark-theme-page">
      <Head>
        <title>{title} | Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <div className="prod">
          <div className="imageWrap">
            <img src={imageUrl} alt={title} />
          </div>

          <div className="info">
            <h1>{title}</h1>
            <p className="sku">ID: {id}</p>
            {sellerName && <p className="seller">Sold by {sellerName}</p>}

            <p className="price">{priceLabel}</p>

            {description && <p className="desc">{description}</p>}

            <h4>Delivery</h4>
            <p className="sub">
              {delivery ||
                "Tracked and insured shipping. Exact options and rates are shown at checkout based on your address."}
            </p>

            <h4>Payment</h4>
            <p className="sub">
              {payment ||
                "Secure payments handled by Stripe. Major cards and wallets accepted."}
            </p>

            <button
              className="buy"
              onClick={handleBuyNow}
              disabled={loading || !price}
            >
              {loading ? "Processing..." : "Buy now"}
            </button>

            <div className="rating">
              <p className="ratingLabel">
                Rate this item{" "}
                {rated && rating && (
                  <span className="ratingThanks">
                    · thanks for rating {rating}★
                  </span>
                )}
              </p>
              <div>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`star ${rating && rating >= v ? "active" : ""}`}
                    onClick={() => handleRate(v)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        .prod {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.6fr);
          gap: 32px;
          align-items: flex-start;
        }
        .imageWrap img {
          width: 100%;
          border-radius: 18px;
          object-fit: cover;
          background: #020617;
        }
        .info h1 {
          font-size: 26px;
          margin: 6px 0 4px;
        }
        .sku {
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 6px;
        }
        .seller {
          font-size: 13px;
          color: #e5e7eb;
          margin-bottom: 6px;
        }
        .price {
          font-size: 22px;
          font-weight: 600;
          margin: 8px 0 14px;
        }
        .desc {
          font-size: 14px;
          color: #e5e7eb;
          margin-bottom: 10px;
        }
        h4 {
          margin: 18px 0 4px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
        }
        .sub {
          font-size: 13px;
          color: #d1d5db;
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
          padding: 0 2px;
        }
        .star.active {
          color: #facc15;
        }
        @media (max-width: 900px) {
          .prod {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<ProductPageProps> = async (
  ctx
) => {
  const rawId = ctx.params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return { notFound: true };

  try {
    const snap = await adminDb.collection("listings").doc(String(id)).get();
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

    let sellerName = d.sellerName || "";
    if (!sellerName && d.sellerId) {
      try {
        const sellerSnap = await adminDb
          .collection("sellers")
          .doc(String(d.sellerId))
          .get();
        if (sellerSnap.exists) {
          const sData: any = sellerSnap.data() || {};
          sellerName = sData.displayName || sData.name || "";
        }
      } catch (e) {
        // if seller lookup fails, just skip
      }
    }

    return {
      props: {
        id: String(id),
        title: d.title || "Listing",
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
