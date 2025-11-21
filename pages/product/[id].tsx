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
  condition: string;
  brand: string;
  category: string;
  color: string;
  size: string;
  description: string;
  sellerName: string;
  allowOffers: boolean;
};

export default function ProductPage(props: ProductPageProps) {
  const {
    id,
    title,
    price,
    currency,
    priceLabel,
    imageUrl,
    condition,
    brand,
    category,
    color,
    size,
    description,
    sellerName,
    allowOffers,
  } = props;

  const [loading, setLoading] = useState(false);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  const handleBuyNow = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title,
          price,
          image: imageUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.sessionId) {
        throw new Error(json?.error || "Unable to create checkout session");
      }

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Stripe not loaded");
      }

      await stripe.redirectToCheckout({ sessionId: json.sessionId });
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Checkout failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOfferError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const offerValue = Number(formData.get("offer_value") || 0);
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!offerValue || offerValue <= 0) {
      setOfferError("Please enter a valid offer.");
      return;
    }

    if (!email) {
      setOfferError("Please enter your email so we can respond.");
      return;
    }

    try {
      setOfferSubmitting(true);
      const res = await fetch("/api/offers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          offerValue,
          buyerEmail: email,
          message,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to submit offer");
      }

      form.reset();
      alert("Your offer has been submitted to the seller.");
    } catch (err: any) {
      console.error(err);
      setOfferError(err?.message || "Unable to submit offer");
    } finally {
      setOfferSubmitting(false);
    }
  };

  return (
    <div className="dark-theme-page">
      <Head>
        <title>{title} — Famous-Finds</title>
      </Head>
      <Header />

      <main className="product-wrap">
        <nav className="breadcrumb">
          <span>Home</span> <span className="mx-1">/</span>
          <span>Women</span> <span className="mx-1">/</span>
          <span className="breadcrumb-active">{title}</span>
        </nav>

        <div className="product-grid">
          <div className="image-column">
            <div className="image-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={title} className="product-image" />
            </div>
            <p className="image-note">
              Authenticity and quality vetted before shipment. Free returns if
              not as described.
            </p>
          </div>

          <div className="details-column">
            <div>
              <p className="eyebrow">Famous-Finds</p>
              <h1>{title}</h1>
              <p className="seller-note">
                Sold by {sellerName}. Inspected and shipped via Famous-Finds
                concierge.
              </p>
            </div>

            <div className="price-box">
              <p className="price-label">{priceLabel}</p>
              <p className="price-note">
                All prices in USD. Taxes and shipping calculated at checkout.
              </p>
            </div>

            <dl className="details-grid">
              <div className="detail-item">
                <dt>Condition</dt>
                <dd>{condition}</dd>
              </div>
              <div className="detail-item">
                <dt>Brand</dt>
                <dd>{brand}</dd>
              </div>
              <div className="detail-item">
                <dt>Category</dt>
                <dd>{category}</dd>
              </div>
              <div className="detail-item">
                <dt>Color</dt>
                <dd>{color}</dd>
              </div>
              <div className="detail-item">
                <dt>Size</dt>
                <dd>{size}</dd>
              </div>
            </dl>

            <div>
              <h2 className="description-heading">Description</h2>
              <p className="description-body">
                {description || "No additional description provided."}
              </p>
            </div>

            <div className="button-row">
              <button
                onClick={handleBuyNow}
                disabled={loading}
                className="btn-buy"
              >
                {loading ? "Processing…" : "Buy now"}
              </button>

              {allowOffers && (
                <button
                  onClick={() => {
                    const form = document.getElementById("offer-form");
                    if (form) {
                      form.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className="btn-offer"
                >
                  Make an offer
                </button>
              )}
            </div>

            <div className="protection-box">
              <p className="protection-title">
                How Famous-Finds protects you
              </p>
              <ul className="protection-list">
                <li>Funds held securely until your item is authenticated.</li>
                <li>
                  If the item is not as described, you are fully refunded.
                </li>
                <li>All payments processed in USD via Stripe.</li>
              </ul>
            </div>
          </div>
        </div>

        {allowOffers && (
          <section id="offer-form" className="offer-section">
            <h2 className="offer-heading">Make an offer</h2>
            <p className="offer-subtitle">
              If you have a reasonable offer, submit it here and our team will
              contact the seller on your behalf.
            </p>

            <form onSubmit={handleOfferSubmit} className="offer-form">
              <div className="form-field">
                <label htmlFor="offer_value" className="form-label">
                  Offer amount (USD)
                </label>
                <input
                  id="offer_value"
                  name="offer_value"
                  type="number"
                  step="1"
                  min="1"
                  className="form-input"
                  placeholder="Enter your offer in USD"
                />
              </div>

              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  Your email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-field">
                <label htmlFor="message" className="form-label">
                  Optional message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  className="form-textarea"
                  placeholder="Tell the seller anything you’d like them to know."
                />
              </div>

              {offerError && <p className="form-error">{offerError}</p>}

              <button
                type="submit"
                disabled={offerSubmitting}
                className="btn-submit-offer"
              >
                {offerSubmitting ? "Submitting…" : "Submit offer"}
              </button>
            </form>
          </section>
        )}
      </main>

      <Footer />

      {/* styles unchanged */}
      <style jsx>{`/* (same CSS as your current file) */`}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<ProductPageProps> = async (
  context
) => {
  const id = String(context.params?.id || "");

  if (!id) {
    return { notFound: true };
  }

  try {
    const doc = await adminDb.collection("listings").doc(id).get();
    if (!doc.exists) {
      return { notFound: true };
    }

    const d: any = doc.data() || {};
    const priceNumber = Number(d.price) || 0;
    const currency = d.currency || "USD";
    const priceLabel = priceNumber
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(priceNumber)
      : "";

    const sellerName =
      d.sellerName || d.sellerDisplayName || "Independent seller";

    const imageUrl =
      d.image_url ||
      d.imageUrl ||
      d.image ||
      (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
      (Array.isArray(d.auth_photos) && d.auth_photos[0]) ||
      "";

    return {
      props: {
        id,
        title: d.title || "Product",
        price: priceNumber,
        currency,
        priceLabel,
        imageUrl,
        condition: d.condition || "Pre-owned",
        brand: d.brand || "Designer",
        category: d.category || "Fashion",
        color: d.color || "Mixed",
        size: d.size || "One size",
        description: d.description || "",
        sellerName,
        allowOffers: !!d.allowOffers,
      },
    };
  } catch (err) {
    console.error("Error loading product:", err);
    return { notFound: true };
  }
};
