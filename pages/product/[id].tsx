// FILE: /pages/product/[id].tsx

import React, { useEffect, useState } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getStripe } from "../../lib/getStripe";
import { adminDb } from "../../utils/firebaseAdmin";
import WishlistButton from "../../components/WishlistButton";
import { auth, db, firebaseClientReady } from "../../utils/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";

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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [buyerDetails, setBuyerDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (!firebaseClientReady || !auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!firebaseClientReady || !db || !userId) return;
    const docId = `${userId}_${id}`;
    const ref = doc(db, "buyerRecentlyViewed", docId);
    setDoc(
      ref,
      {
        userId,
        listingId: id,
        title,
        brand,
        price,
        currency,
        imageUrl,
        viewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => {
      console.error("recently_viewed_error", err);
    });
  }, [brand, currency, db, firebaseClientReady, id, imageUrl, price, title, userId]);

  const handleBuyNow = async () => {
    try {
      setCheckoutError(null);
      const requiredFields = [
        buyerDetails.fullName,
        buyerDetails.email,
        buyerDetails.phone,
        buyerDetails.addressLine1,
        buyerDetails.city,
        buyerDetails.state,
        buyerDetails.postalCode,
        buyerDetails.country,
      ];
      const isComplete = requiredFields.every((v) => String(v).trim().length > 0);
      if (!isComplete) {
        setCheckoutError("Please complete the delivery details before checkout.");
        return;
      }

      setLoading(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
        body: JSON.stringify({
          id,
          title,
          price,
          image: imageUrl,
          brand,
          category,
          buyerDetails,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.sessionId) {
        throw new Error(json?.error || "Unable to create checkout session");
      }

      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe not loaded");

      const result = await stripe.redirectToCheckout({ sessionId: json.sessionId });

      // ✅ HARD FALLBACK: if Stripe.js redirect fails but we have a session URL, redirect directly
      if (result?.error && json?.url) {
        window.location.assign(json.url);
        return;
      }

      if (result?.error) {
        throw new Error(result.error.message || "Checkout failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Checkout failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateBuyerDetail = (field: keyof typeof buyerDetails, value: string) => {
    setBuyerDetails((prev) => ({ ...prev, [field]: value }));
  };

  const formComplete = [
    buyerDetails.fullName,
    buyerDetails.email,
    buyerDetails.phone,
    buyerDetails.addressLine1,
    buyerDetails.city,
    buyerDetails.state,
    buyerDetails.postalCode,
    buyerDetails.country,
  ].every((value) => String(value).trim().length > 0);

  const handleOfferSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOfferError(null);
    if (!userId) {
      setOfferError("Please sign in to make an offer.");
      router.push("/buyer/signin");
      return;
    }

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
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": userId } : {}),
        },
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
          {/* Product image */}
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

          {/* Product details */}
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

            <div className="button-row">
              <WishlistButton productId={id} />
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

            <div className="delivery-form">
              <h2 className="description-heading">Delivery details</h2>
              <p className="form-hint">
                Please provide your shipping information before checkout. Your Buy
                Now button will unlock once all required fields are complete.
              </p>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="buyer-full-name" className="form-label">
                    Full name *
                  </label>
                  <input
                    id="buyer-full-name"
                    type="text"
                    className="form-input"
                    value={buyerDetails.fullName}
                    onChange={(e) => updateBuyerDetail("fullName", e.target.value)}
                    placeholder="Full legal name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="buyer-email" className="form-label">
                    Email *
                  </label>
                  <input
                    id="buyer-email"
                    type="email"
                    className="form-input"
                    value={buyerDetails.email}
                    onChange={(e) => updateBuyerDetail("email", e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="buyer-phone" className="form-label">
                    Phone *
                  </label>
                  <input
                    id="buyer-phone"
                    type="tel"
                    className="form-input"
                    value={buyerDetails.phone}
                    onChange={(e) => updateBuyerDetail("phone", e.target.value)}
                    placeholder="+1 555 123 4567"
                    required
                  />
                </div>

                <div className="form-field form-field--wide">
                  <label htmlFor="buyer-address-1" className="form-label">
                    Address line 1 *
                  </label>
                  <input
                    id="buyer-address-1"
                    type="text"
                    className="form-input"
                    value={buyerDetails.addressLine1}
                    onChange={(e) => updateBuyerDetail("addressLine1", e.target.value)}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="form-field form-field--wide">
                  <label htmlFor="buyer-address-2" className="form-label">
                    Address line 2
                  </label>
                  <input
                    id="buyer-address-2"
                    type="text"
                    className="form-input"
                    value={buyerDetails.addressLine2}
                    onChange={(e) => updateBuyerDetail("addressLine2", e.target.value)}
                    placeholder="Apartment, suite, unit (optional)"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="buyer-city" className="form-label">
                    City *
                  </label>
                  <input
                    id="buyer-city"
                    type="text"
                    className="form-input"
                    value={buyerDetails.city}
                    onChange={(e) => updateBuyerDetail("city", e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="buyer-state" className="form-label">
                    State/Province *
                  </label>
                  <input
                    id="buyer-state"
                    type="text"
                    className="form-input"
                    value={buyerDetails.state}
                    onChange={(e) => updateBuyerDetail("state", e.target.value)}
                    placeholder="State or province"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="buyer-postal" className="form-label">
                    Postal code *
                  </label>
                  <input
                    id="buyer-postal"
                    type="text"
                    className="form-input"
                    value={buyerDetails.postalCode}
                    onChange={(e) => updateBuyerDetail("postalCode", e.target.value)}
                    placeholder="ZIP / postal code"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="buyer-country" className="form-label">
                    Country *
                  </label>
                  <input
                    id="buyer-country"
                    type="text"
                    className="form-input"
                    value={buyerDetails.country}
                    onChange={(e) => updateBuyerDetail("country", e.target.value)}
                    placeholder="Country"
                    required
                  />
                </div>
              </div>

              {checkoutError && <p className="form-error">{checkoutError}</p>}
            </div>

            <div className="button-row">
              <button
                onClick={handleBuyNow}
                disabled={loading || !formComplete}
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

        {/* Offer form – only when allowed */}
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

      <style jsx>{`
        .product-wrap {
          max-width: 1152px;
          margin: 0 auto;
          padding: 24px 16px 64px;
        }

        .breadcrumb {
          margin-bottom: 16px;
          font-size: 12px;
          color: #6b7280;
        }
        .breadcrumb-active {
          color: #111827;
        }

        .product-grid {
          display: grid;
          gap: 40px;
        }
        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          }
        }

        .image-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .image-wrapper {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .product-image {
          aspect-ratio: 4 / 5;
          width: 100%;
          object-fit: cover;
        }
        .image-note {
          font-size: 12px;
          color: #4b5563;
        }

        .details-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #047857;
        }
        h1 {
          margin-top: 4px;
          font-size: 24px;
          font-weight: 600;
          color: #111827;
        }
        .seller-note {
          margin-top: 4px;
          font-size: 14px;
          color: #4b5563;
        }

        .price-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .price-label {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }
        .price-note {
          font-size: 12px;
          color: #4b5563;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          font-size: 12px;
          color: #111827;
        }
        .detail-item dt {
          color: #6b7280;
        }
        .detail-item dd {
          font-weight: 600;
          color: #111827;
        }

        .description-heading {
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #374151;
        }
        .description-body {
          font-size: 14px;
          line-height: 1.6;
          color: #111827;
        }

        .button-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        @media (min-width: 640px) {
          .button-row {
            flex-direction: row;
          }
        }

        .btn-buy,
        .btn-offer {
          display: inline-flex;
          flex: 1;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          transition: all 150ms;
          cursor: pointer;
        }
        .btn-buy {
          background: #111827;
          color: #ffffff;
          border: none;
        }
        .btn-buy:hover {
          background: #000000;
        }
        .btn-buy:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-offer {
          border: 1px solid #111827;
          color: #111827;
          background: #ffffff;
        }
        .btn-offer:hover {
          background: #f3f4f6;
        }

        .protection-box {
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #f3f4f6;
          padding: 16px;
          font-size: 12px;
          color: #111827;
        }
        .protection-title {
          font-weight: 600;
          color: #111827;
        }
        .protection-list {
          margin-top: 8px;
          list-style-type: disc;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-left: 16px;
        }

        .delivery-form {
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .form-hint {
          font-size: 12px;
          color: #6b7280;
        }
        .form-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .form-field--wide {
          grid-column: span 2;
        }
        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .form-field--wide {
            grid-column: span 1;
          }
        }

        .offer-section {
          margin-top: 48px;
          max-width: 640px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .offer-heading {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #374151;
        }
        .offer-subtitle {
          font-size: 12px;
          color: #4b5563;
        }

        .offer-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 16px;
          font-size: 12px;
        }

        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #4b5563;
        }
        .form-input,
        .form-textarea {
          margin-top: 4px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          padding: 8px 12px;
          font-size: 12px;
          color: #111827;
        }
        .form-input:focus,
        .form-textarea:focus {
          border-color: #111827;
          outline: none;
        }

        .form-error {
          font-size: 12px;
          color: #b91c1c;
        }

        .btn-submit-offer {
          display: inline-flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #111827;
          padding: 10px 24px;
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          transition: all 150ms;
          border: none;
          cursor: pointer;
        }
        .btn-submit-offer:hover {
          background: #000000;
        }
        .btn-submit-offer:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>
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

    const d = doc.data() || {};
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
      d.displayImageUrl ||
      d.display_image_url ||
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
