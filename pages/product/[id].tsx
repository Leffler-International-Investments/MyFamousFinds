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
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Buyer details must be completed before checkout is enabled
  const [buyerDetails, setBuyerDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "AU",
  });
  const [buyerTouched, setBuyerTouched] = useState(false);

  const isBuyerDetailsValid = (() => {
    const b = buyerDetails;
    const required = [
      b.fullName,
      b.email,
      b.phone,
      b.addressLine1,
      b.city,
      b.state,
      b.postalCode,
      b.country,
    ];
    return required.every((v) => String(v || "").trim().length > 0);
  })();

  useEffect(() => {
    if (!firebaseClientReady || !auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);

      // helpful auto-fill for signed-in users
      const email = user?.email || "";
      if (email) {
        setBuyerDetails((p) => ({ ...p, email }));
      }
      const name = (user as any)?.displayName || "";
      if (name) {
        setBuyerDetails((p) => ({ ...p, fullName: p.fullName || name }));
      }
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
      if (!isBuyerDetailsValid) {
        setBuyerTouched(true);
        const el = document.getElementById("buyer-details-form");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        alert("Please complete your buyer details before checkout.");
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
    const offerValue = Number(formData.get("offer_value"));
    const offerMessage = String(formData.get("offer_message") || "").trim();

    if (!offerValue || offerValue <= 0) {
      setOfferError("Please enter a valid offer amount.");
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
          listingId: id,
          offerValue,
          offerMessage,
          title,
          brand,
          price,
          currency,
          imageUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to submit offer");
      }

      form.reset();
      alert("Your offer has been submitted.");
    } catch (err: any) {
      console.error(err);
      setOfferError(err?.message || "Offer submission failed.");
    } finally {
      setOfferSubmitting(false);
    }
  };

  return (
    <div className="page">
      <Head>
        <title>{title} – Famous Finds</title>
      </Head>

      <Header />

      <main className="container">
        <div className="breadcrumb">
          <span>Home</span> / <span>{category || "Catalogue"}</span> / <span>{title}</span>
        </div>

        <div className="grid">
          <div className="imageWrap">
            <img src={imageUrl} alt={title} className="image" />
          </div>

          <div className="details">
            <div className="brand">{brand || "FAMOUS-FINDS"}</div>
            <h1 className="title">{title}</h1>
            <p className="subtitle">
              Sold by Independent seller. Inspected and shipped via Famous-Finds concierge.
            </p>

            <div className="price">{priceLabel}</div>
            <p className="smallNote">
              All prices in USD. Taxes and shipping calculated at checkout.
            </p>

            <WishlistButton listingId={id} />

            <div className="meta">
              <div>
                <div className="metaLabel">Condition</div>
                <div className="metaValue">{condition || "—"}</div>
              </div>
              <div>
                <div className="metaLabel">Brand</div>
                <div className="metaValue">{brand || "—"}</div>
              </div>
              <div>
                <div className="metaLabel">Category</div>
                <div className="metaValue">{category || "—"}</div>
              </div>
              <div>
                <div className="metaLabel">Color</div>
                <div className="metaValue">{color || "—"}</div>
              </div>
              <div>
                <div className="metaLabel">Size</div>
                <div className="metaValue">{size || "—"}</div>
              </div>
            </div>

            <div className="desc">
              <div className="descLabel">DESCRIPTION</div>
              <div className="descText">{description || "No additional description provided."}</div>
            </div>

            {/* ✅ REQUIRED BEFORE CHECKOUT */}
            <div id="buyer-details-form" className="buyer-box">
              <h3 className="buyer-title">Buyer details</h3>
              <p className="buyer-hint">
                Complete your details below. The <strong>Buy now</strong> button will activate
                once all required fields are filled.
              </p>

              <div className="buyer-grid">
                <div className="buyer-field">
                  <label>
                    Full name <span className="req">*</span>
                  </label>
                  <input
                    value={buyerDetails.fullName}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyerDetails((p) => ({ ...p, fullName: e.target.value }));
                    }}
                    placeholder="Full name"
                  />
                  {buyerTouched && !buyerDetails.fullName.trim() && (
                    <div className="buyer-error">Required</div>
                  )}
                </div>

                <div className="buyer-field">
                  <label>
                    Email <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    value={buyerDetails.email}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyerDetails((p) => ({ ...p, email: e.target.value }));
                    }}
                    placeholder="Email"
                  />
                  {buyerTouched && !buyerDetails.email.trim() && (
                    <div className="buyer-error">Required</div>
                  )}
                </div>

                <div className="buyer-field">
                  <label>
                    Phone <span className="req">*</span>
                  </label>
                  <input
                    value={buyerDetails.phone}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyerDetails((p) => ({ ...p, phone: e.target.value }));
                    }}
                    placeholder="Phone"
                  />
                  {buyerTouched && !buyerDetails.phone.trim() && (
                    <div className="buyer-error">Required</div>
                  )}
                </div>

                <div className="buyer-field buyer-wide">
                  <label>
                    Address line 1 <span className="req">*</span>
                  </label>
                  <input
                    value={buyerDetails.addressLine1}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyerDetails((p) => ({ ...p, addressLine1: e.target.value }));
                    }}
                    placeholder="Street address"
                  />
                  {buyerTouched && !buyerDetails.addressLine1.trim() && (
                    <div className="buyer-error">Required</div>
                  )}
                </div>

                <div className="buyer-field buyer-wide">
                  <label>Address line 2</label>
                  <input
                    value={buyerDetails.addressLine2}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyerDetails((p) => ({ ...p, addressLine2: e.target.value }));
                    }}
                    placeholder="Apartment, unit, etc (optional)"
                  />
                </div>

                <div className="buyer-field">
                  <label>
                    City <span className="req">*</span>
                  </label>
                  <input
                    value={buyerDetails.city}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyerDetails((p) => ({ ...p, city: e.target.value }));
                    }}
                    placeholder="City"
                  />
                  {buyerTouched && !buyerDetails.city.trim() && (
                    <div className="buyer-error">Required</div>
                  )}
                </div>

                <div className="buyer-field">
                  <label>
                    State <span className="req">*</span>
                  </label>
                  <input
                    value={buyerDetails.state}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyerDetails((p) => ({ ...p, state: e.target.value }));
                    }}
                    placeholder="State"
                  />
                  {buyerTouched && !buyerDetails.state.trim() && (
                    <div className="buyer-error">Required</div>
                  )}
                </div>

                <div className="buyer-field">
                  <label>
                    Postcode <span className="req">*</span>
                  </label>
                  <input
                    value={buyerDetails.postalCode}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyerDetails((p) => ({ ...p, postalCode: e.target.value }));
                    }}
                    placeholder="Postcode"
                  />
                  {buyerTouched && !buyerDetails.postalCode.trim() && (
                    <div className="buyer-error">Required</div>
                  )}
                </div>

                <div className="buyer-field">
                  <label>
                    Country <span className="req">*</span>
                  </label>
                  <input
                    value={buyerDetails.country}
                    onChange={(e) => {
                      setBuyerTouched(true);
                      setBuyerDetails((p) => ({ ...p, country: e.target.value }));
                    }}
                    placeholder="Country (e.g. AU)"
                  />
                  {buyerTouched && !buyerDetails.country.trim() && (
                    <div className="buyer-error">Required</div>
                  )}
                </div>
              </div>

              {!isBuyerDetailsValid && buyerTouched && (
                <div className="buyer-warning">
                  Please fill all required fields (*) to enable checkout.
                </div>
              )}
            </div>

            <div className="button-row">
              <button
                onClick={handleBuyNow}
                disabled={loading || !isBuyerDetailsValid}
                className="btn-buy"
              >
                {loading ? "Processing…" : isBuyerDetailsValid ? "Buy now" : "Complete details to buy"}
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
              <p className="protection-title">How Famous-Finds protects you</p>
              <ul className="protection-list">
                <li>Funds held securely until your item is authenticated.</li>
                <li>If the item is not as described, you are fully refunded.</li>
                <li>All payments processed in USD via Stripe.</li>
              </ul>
            </div>

            {allowOffers && (
              <div className="offer-wrap" id="offer-form">
                <h3 className="offer-title">Make an offer</h3>
                <p className="offer-note">
                  Enter an amount you’d like to pay. The seller can accept, counter, or decline.
                </p>

                <form onSubmit={handleOfferSubmit} className="offer-form">
                  <label className="offer-label">
                    Offer amount ({currency || "USD"})
                    <input name="offer_value" type="number" min="1" step="1" className="offer-input" />
                  </label>

                  <label className="offer-label">
                    Message (optional)
                    <textarea name="offer_message" className="offer-textarea" rows={3} />
                  </label>

                  {offerError && <div className="offer-error">{offerError}</div>}

                  <button className="offer-submit" type="submit" disabled={offerSubmitting}>
                    {offerSubmitting ? "Submitting…" : "Submit offer"}
                  </button>
                </form>
              </div>
            )}

            <div className="sellerLine">
              <span className="sellerLabel">Seller:</span> {sellerName || "Independent seller"}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          background: #ffffff;
        }
        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 18px 16px 40px;
        }
        .breadcrumb {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 12px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 26px;
          align-items: start;
        }
        .imageWrap {
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          background: #fff;
        }
        .image {
          width: 100%;
          display: block;
          object-fit: cover;
        }
        .details {
          padding-top: 6px;
        }
        .brand {
          font-size: 12px;
          letter-spacing: 0.22em;
          color: #0f172a;
          text-transform: uppercase;
        }
        .title {
          margin: 6px 0 8px;
          font-size: 28px;
          font-weight: 700;
          color: #0b1220;
        }
        .subtitle {
          margin: 0 0 12px;
          font-size: 13px;
          color: #4b5563;
          max-width: 540px;
        }
        .price {
          font-size: 26px;
          font-weight: 800;
          margin: 10px 0 6px;
        }
        .smallNote {
          margin: 0 0 12px;
          font-size: 12px;
          color: #6b7280;
        }
        .meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 18px;
          margin: 14px 0 12px;
        }
        .metaLabel {
          font-size: 11px;
          color: #6b7280;
        }
        .metaValue {
          font-size: 13px;
          color: #0b1220;
          font-weight: 600;
        }
        .desc {
          margin-top: 10px;
        }
        .descLabel {
          font-size: 12px;
          letter-spacing: 0.2em;
          color: #0f172a;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .descText {
          font-size: 13px;
          color: #374151;
          line-height: 1.5;
        }
        .button-row {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .btn-buy {
          width: 100%;
          border: none;
          border-radius: 999px;
          background: #0b1220;
          color: white;
          padding: 12px 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-buy:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .btn-offer {
          width: 100%;
          border: 1px solid #0b1220;
          border-radius: 999px;
          background: white;
          color: #0b1220;
          padding: 12px 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .protection-box {
          margin-top: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px 14px;
          background: #f9fafb;
        }
        .protection-title {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 800;
          color: #111827;
        }
        .protection-list {
          margin: 0;
          padding-left: 18px;
          color: #374151;
          font-size: 13px;
        }
        .offer-wrap {
          margin-top: 18px;
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }
        .offer-title {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 800;
        }
        .offer-note {
          margin: 0 0 12px;
          font-size: 13px;
          color: #6b7280;
        }
        .offer-form {
          display: grid;
          gap: 10px;
          max-width: 520px;
        }
        .offer-label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          color: #111827;
        }
        .offer-input,
        .offer-textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 10px 10px;
          font-size: 14px;
        }
        .offer-error {
          color: #b91c1c;
          font-size: 13px;
          font-weight: 700;
        }
        .offer-submit {
          border: none;
          border-radius: 10px;
          background: #111827;
          color: white;
          padding: 10px 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .offer-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .sellerLine {
          margin-top: 16px;
          font-size: 12px;
          color: #6b7280;
        }
        .sellerLabel {
          font-weight: 800;
          color: #111827;
        }

        .buyer-box {
          margin-top: 18px;
          padding: 14px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fafafa;
        }
        .buyer-title {
          margin: 0 0 6px;
          font-size: 14px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #111827;
        }
        .buyer-hint {
          margin: 0 0 12px;
          font-size: 13px;
          color: #374151;
        }
        .buyer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .buyer-wide {
          grid-column: 1 / -1;
        }
        .buyer-field label {
          display: block;
          font-size: 12px;
          color: #111827;
          margin-bottom: 4px;
        }
        .buyer-field input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 10px 10px;
          font-size: 14px;
          outline: none;
          background: white;
        }
        .buyer-field input:focus {
          border-color: #111827;
        }
        .req {
          color: #b91c1c;
        }
        .buyer-error {
          margin-top: 4px;
          font-size: 12px;
          color: #b91c1c;
        }
        .buyer-warning {
          margin-top: 10px;
          font-size: 13px;
          color: #b91c1c;
        }
        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 820px) {
          .buyer-grid {
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
  const id = String(ctx.params?.id || "");

  if (!id) {
    return { notFound: true };
  }

  try {
    if (!adminDb) return { notFound: true };

    const docSnap = await adminDb.collection("listings").doc(id).get();
    if (!docSnap.exists) {
      return { notFound: true };
    }

    const d: any = docSnap.data() || {};

    // If already sold, hide page (prevents double purchase)
    const status = String(d.status || "").toLowerCase();
    const isSold = d.isSold === true || d.sold === true || status === "sold";
    if (isSold) {
      return { notFound: true };
    }

    const title = String(d.title || d.name || "Untitled");
    const price = typeof d.priceUsd === "number" ? d.priceUsd : Number(d.price || 0);
    const currency = String(d.currency || "USD").toUpperCase();
    const priceLabel = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price || 0);

    const images = Array.isArray(d.images) ? d.images : [];
    const imageUrl =
      String(d.displayImageUrl || d.display_image_url || images[0] || "").trim() ||
      "/placeholder.png";

    const condition = String(d.condition || "").trim();
    const brand = String(d.brand || d.designer || "").trim();
    const category = String(d.category || "").trim();
    const color = String(d.color || d.colour || "").trim();
    const size = String(d.size || "").trim();
    const description = String(d.description || "").trim();
    const sellerName = String(d.sellerName || d.seller || "").trim();
    const allowOffers = d.allowOffers !== false;

    return {
      props: {
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
      },
    };
  } catch (err) {
    console.error("product_page_ssr_error", err);
    return { notFound: true };
  }
};
