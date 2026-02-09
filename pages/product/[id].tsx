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
  allowPurchase: boolean;
  isSold: boolean;
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
    allowPurchase,
    isSold,
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

  // ✅ Robust image fallback so the product image never disappears
  const FALLBACK_IMG = "/Famous-Finds-Logo-2.png";
  const isLikelyValidSrc = (src?: string | null) => {
    const s = String(src || "").trim();
    if (!s) return false;
    if (s === "[object Object]") return false;
    if (s.startsWith("data:image/")) return true;
    if (s.startsWith("http://") || s.startsWith("https://")) return true;
    if (s.startsWith("/")) return true; // local public asset
    return false;
  };
  const [currentImgSrc, setCurrentImgSrc] = useState(
    isLikelyValidSrc(imageUrl) ? imageUrl : FALLBACK_IMG
  );

  useEffect(() => {
    setCurrentImgSrc(isLikelyValidSrc(imageUrl) ? imageUrl : FALLBACK_IMG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

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
      if (!allowPurchase) {
        alert("This item is no longer available.");
        return;
      }
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

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to create checkout session");
      }

      // ✅ Prefer Stripe-hosted URL (session.url) – this is the modern,
      // recommended approach and avoids publishable-key mismatch issues
      // that can cause "Something went wrong" on the checkout page.
      if (json.url) {
        window.location.assign(json.url);
        return;
      }

      // Fallback: use Stripe.js redirectToCheckout if no URL returned
      if (json.sessionId) {
        const stripe = await getStripe();
        if (!stripe) throw new Error("Stripe not loaded");

        const result = await stripe.redirectToCheckout({ sessionId: json.sessionId });
        if (result?.error) {
          throw new Error(result.error.message || "Checkout failed");
        }
        return;
      }

      throw new Error("No checkout URL or session ID returned");
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
          productId: id, // ✅ REQUIRED by API
          price: offerValue, // ✅ API accepts price
          message: offerMessage,
          buyerEmail: buyerDetails.email || "", // optional
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        const friendly =
          json?.error === "missing_fields"
            ? "Please enter an offer amount before submitting."
            : json?.error || "Unable to submit offer.";
        throw new Error(friendly);
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
            <img
              src={currentImgSrc}
              alt={title}
              className="image"
              onError={() => {
                if (currentImgSrc !== FALLBACK_IMG) setCurrentImgSrc(FALLBACK_IMG);
              }}
            />
          </div>

          <div className="details">
            <div className="brand">{brand || "FAMOUS-FINDS"}</div>
            <h1 className="title">{title}</h1>
            <p className="subtitle">
              Sold by Independent seller. Inspected and shipped via Famous-Finds concierge.
            </p>

            <div className="price">{priceLabel}</div>
            <p className="smallNote">All prices in USD. Taxes and shipping calculated at checkout.</p>

            <WishlistButton productId={id} />

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
                Complete your details below. The <strong>Buy now</strong> button will activate once all
                required fields are filled.
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
                <div className="buyer-warning">Please fill all required fields (*) to enable checkout.</div>
              )}
            </div>

            <div className="button-row">
              <button
                onClick={handleBuyNow}
                disabled={loading || !isBuyerDetailsValid || !allowPurchase}
                className="btn-buy"
              >
                {loading
                  ? "Processing…"
                  : isSold
                  ? "Sold"
                  : !isBuyerDetailsValid
                  ? "Complete details to buy"
                  : "Buy now"}
              </button>

              {allowOffers && !isSold && (
                <button
                  onClick={() => {
                    const form = document.getElementById("offer-form");
                    if (form) {
                      form.scrollIntoView({ behavior: "smooth", block: "start" });
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

            {allowOffers && !isSold && (
              <div className="offer-wrap" id="offer-form">
                <h3 className="offer-title">Make an offer</h3>
                <p className="offer-note">Enter an amount you’d like to pay. The seller can accept, counter, or decline.</p>

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

                  <button type="submit" disabled={offerSubmitting} className="offer-submit">
                    {offerSubmitting ? "Submitting…" : "Submit offer"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          background: #fff;
          min-height: 100vh;
        }
        .container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 24px 20px 60px;
        }
        .breadcrumb {
          font-size: 12px;
          color: #777;
          margin: 12px 0 18px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 28px;
          align-items: start;
        }
        .imageWrap {
          width: 100%;
          border: 1px solid #ececec;
          border-radius: 14px;
          padding: 18px;
          background: #fafafa;
        }
        .image {
          width: 100%;
          height: 360px;
          object-fit: contain;
          border-radius: 10px;
          background: #fff;
          border: 1px solid #f0f0f0;
        }
        .details {
          width: 100%;
        }
        .brand {
          font-size: 12px;
          letter-spacing: 0.18em;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .title {
          font-size: 30px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #111;
        }
        .subtitle {
          margin: 0 0 16px;
          color: #666;
          font-size: 13px;
          line-height: 1.4;
        }
        .price {
          font-size: 28px;
          font-weight: 800;
          margin-top: 8px;
          color: #111;
        }
        .smallNote {
          margin: 6px 0 14px;
          font-size: 12px;
          color: #777;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 22px;
          margin: 16px 0 18px;
        }
        .metaLabel {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .metaValue {
          font-size: 13px;
          color: #111;
          font-weight: 600;
        }
        .desc {
          margin-top: 8px;
        }
        .descLabel {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 6px;
        }
        .descText {
          font-size: 13px;
          color: #333;
          line-height: 1.6;
        }

        .buyer-box {
          margin-top: 22px;
          border: 1px solid #ececec;
          border-radius: 14px;
          padding: 18px;
          background: #fff;
        }
        .buyer-title {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .buyer-hint {
          margin: 0 0 14px;
          font-size: 12px;
          color: #666;
        }
        .buyer-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .buyer-field label {
          display: block;
          font-size: 12px;
          color: #333;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .req {
          color: #d11;
          font-weight: 900;
        }
        .buyer-field input,
        .buyer-field textarea {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
        }
        .buyer-wide {
          grid-column: span 2;
        }
        .buyer-error {
          margin-top: 6px;
          font-size: 11px;
          color: #d11;
          font-weight: 700;
        }
        .buyer-warning {
          margin-top: 12px;
          font-size: 12px;
          color: #a64b00;
          background: #fff3e8;
          border: 1px solid #ffd7b8;
          border-radius: 10px;
          padding: 10px 12px;
        }

        .button-row {
          display: flex;
          gap: 12px;
          margin-top: 14px;
          align-items: center;
        }
        .btn-buy {
          flex: 1;
          background: #6b6b6b;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 12px 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-buy:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-offer {
          flex: 1;
          background: #fff;
          color: #111;
          border: 1px solid #ddd;
          border-radius: 999px;
          padding: 12px 16px;
          font-weight: 800;
          cursor: pointer;
        }

        .protection-box {
          margin-top: 14px;
          border: 1px solid #ececec;
          border-radius: 14px;
          padding: 14px 16px;
          background: #fff;
        }
        .protection-title {
          font-weight: 800;
          margin: 0 0 10px;
          font-size: 12px;
        }
        .protection-list {
          margin: 0;
          padding-left: 18px;
          color: #555;
          font-size: 12px;
        }
        .offer-wrap {
          margin-top: 16px;
          border: 1px solid #ececec;
          border-radius: 14px;
          padding: 18px;
          background: #fff;
        }
        .offer-title {
          margin: 0 0 6px;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .offer-note {
          margin: 0 0 12px;
          color: #666;
          font-size: 12px;
        }
        .offer-form {
          display: grid;
          gap: 10px;
        }
        .offer-label {
          font-size: 12px;
          color: #333;
          font-weight: 700;
          display: grid;
          gap: 6px;
        }
        .offer-input,
        .offer-textarea {
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          width: 100%;
        }
        .offer-submit {
          background: #111;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 12px 16px;
          font-weight: 900;
          cursor: pointer;
        }
        .offer-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .offer-error {
          color: #b00020;
          font-weight: 800;
          font-size: 12px;
        }

        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .image {
            height: 320px;
          }
          .buyer-grid {
            grid-template-columns: 1fr;
          }
          .buyer-wide {
            grid-column: span 1;
          }
          .button-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<ProductPageProps> = async (ctx) => {
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

    const status = String(d.status || "").toLowerCase();
    const isSold = d.isSold === true || d.sold === true || status === "sold";
    const isLive = status === "live";
    const allowPurchase = isLive && !isSold;

    const title = String(d.title || d.name || "Untitled");
    const price = typeof d.priceUsd === "number" ? d.priceUsd : Number(d.price || 0);
    const currency = String(d.currency || "USD").toUpperCase();
    const priceLabel = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price || 0);

    const images = Array.isArray(d.images) ? d.images : [];

    const pickFrom = (v: any): string => {
      if (!v) return "";
      if (typeof v === "string") return v;
      if (typeof v === "object") {
        return (
          v.displayUrl ||
          v.displayImageUrl ||
          v.url ||
          v.src ||
          v.originalUrl ||
          v.original ||
          ""
        );
      }
      return "";
    };

    const normalizeSrc = (src: any): string => {
      const s = String(src || "").trim();
      if (!s || s === "[object Object]") return "";
      if (s.startsWith("data:image/")) return s;
      if (s.startsWith("http://") || s.startsWith("https://")) return s;
      if (s.startsWith("/")) return s;
      return "";
    };

    const imageUrl =
      normalizeSrc(
        pickFrom(d.displayImageUrl) ||
          pickFrom(d.display_image_url) ||
          pickFrom(d.displayImageUrls?.[0]) ||
          pickFrom(d.imageUrl) ||
          pickFrom(d.image_url) ||
          pickFrom(d.image) ||
          pickFrom(d.imageUrls?.[0]) ||
          pickFrom(images?.[0])
      ) || "/Famous-Finds-Logo-2.png";

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
        allowPurchase,
        isSold,
      },
    };
  } catch (err) {
    console.error("product_page_ssr_error", err);
    return { notFound: true };
  }
};
