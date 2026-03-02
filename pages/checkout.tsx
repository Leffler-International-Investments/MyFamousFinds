// FILE: /pages/checkout.tsx
// Checkout page — collects shipping details and processes payment via PayPal.

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firebaseClientReady } from "../utils/firebaseClient";

type CartItem = {
  id: string;
  listingId: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
};

type BuyerProfile = {
  fullName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shipping form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");

  useEffect(() => {
    if (!firebaseClientReady || !auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login?from=/checkout");
        return;
      }
      setUser(u);
      setEmail(u.email || "");
      setFullName(u.displayName || "");

      // Load cart items via API
      try {
        const token = await u.getIdToken();
        const res = await fetch("/api/cart/data", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.ok) {
          setItems(json.cartItems || []);
          const profile: BuyerProfile | null = json.buyerProfile || null;
          if (profile) {
            setFullName(profile.fullName || u.displayName || "");
            setEmail((profile.email || u.email || "").toLowerCase());
            setPhone(profile.phone || "");
            setAddressLine1(profile.addressLine1 || "");
            setAddressLine2(profile.addressLine2 || "");
            setCity(profile.city || "");
            setState(profile.state || "");
            setPostalCode(profile.postalCode || "");
            setCountry(profile.country || "US");
          }
        }
      } catch (err) {
        console.error("Failed to load cart:", err);
      }
      setLoading(false);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cartTotal = items.reduce((sum, i) => sum + i.price, 0);

  const formatPrice = (price: number, currency = "USD") =>
    price > 0
      ? price.toLocaleString("en-US", { style: "currency", currency })
      : "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Please sign in to continue.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-id": user.uid,
        },
        body: JSON.stringify({
          buyerDetails: {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
          },
        }),
      });

      const json = await res.json();
      if (json.ok && json.approveUrl) {
        window.location.assign(json.approveUrl);
      } else {
        setError(json.error || "Failed to create order. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Checkout | Famous Finds</title>
      </Head>

      <Header />

      <main className="checkout-main">
        <div className="checkout-wrap">
          <div className="checkout-header">
            <h1>Checkout</h1>
            <Link href="/cart" className="back-link">
              &#8592; Back to Bag
            </Link>
          </div>

          {loading ? (
            <p className="checkout-loading">Loading...</p>
          ) : items.length === 0 ? (
            <div className="checkout-empty">
              <p>Your bag is empty.</p>
              <Link href="/" className="btn-browse">
                Browse collection
              </Link>
            </div>
          ) : (
            <div className="checkout-grid">
              {/* Order summary */}
              <div className="order-summary">
                <h2>Order Summary</h2>
                <div className="order-items">
                  {items.map((item) => (
                    <div key={item.id} className="order-item">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="order-item-img"
                        />
                      )}
                      <div className="order-item-info">
                        <span className="order-item-title">{item.title}</span>
                        {item.brand && (
                          <span className="order-item-brand">{item.brand}</span>
                        )}
                      </div>
                      <span className="order-item-price">
                        {formatPrice(item.price, item.currency)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <span>Total</span>
                  <span className="order-total-amount">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Shipping form */}
              <form onSubmit={handleSubmit} className="shipping-form">
                <h2>Shipping Details</h2>

                {error && <div className="checkout-error">{error}</div>}

                <div className="form-fields">
                  <div className="form-field">
                    <label htmlFor="fullName">Full name</label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="address1">Address line 1</label>
                    <input
                      id="address1"
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      required
                      placeholder="Street address"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="address2">Address line 2</label>
                    <input
                      id="address2"
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Apt, suite, etc. (optional)"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="city">City</label>
                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        placeholder="City"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="state">State / Province</label>
                      <input
                        id="state"
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="postal">Postal code</label>
                      <input
                        id="postal"
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        placeholder="ZIP / Postal"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="country">Country</label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IT">Italy</option>
                        <option value="ES">Spain</option>
                        <option value="JP">Japan</option>
                        <option value="IL">Israel</option>
                        <option value="ZA">South Africa</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-pay"
                  disabled={submitting}
                >
                  {submitting ? "Processing..." : "Pay with PayPal"}
                </button>
                <div className="protected-badge">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11.5 14.5 16 9.5" />
                  </svg>
                  <span>Protected by Famous Finds — Buyer Protection Guarantee</span>
                </div>
                <p className="checkout-secure">
                  Secure payment processed by PayPal
                </p>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .checkout-main {
          min-height: 60vh;
          padding: 32px 16px;
          background: #ffffff;
        }
        .checkout-wrap {
          max-width: 900px;
          margin: 0 auto;
        }
        .checkout-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .checkout-header h1 {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
        }
        .back-link {
          font-size: 13px;
          color: #2563eb;
        }
        .checkout-loading {
          color: #6b7280;
          font-size: 14px;
        }
        .checkout-empty {
          text-align: center;
          padding: 48px 0;
        }
        .checkout-empty p {
          font-size: 16px;
          color: #111827;
        }
        .btn-browse {
          display: inline-block;
          margin-top: 16px;
          border-radius: 999px;
          background: #111827;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 500;
          color: white;
          text-decoration: none;
        }
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Order summary */
        .order-summary {
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          align-self: start;
        }
        .order-summary h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px;
          color: #111827;
        }
        .order-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .order-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .order-item-img {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #e5e7eb;
        }
        .order-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .order-item-title {
          font-size: 13px;
          font-weight: 500;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .order-item-brand {
          font-size: 11px;
          color: #6b7280;
        }
        .order-item-price {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
        }
        .order-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #374151;
        }
        .order-total-amount {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        /* Shipping form */
        .shipping-form h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px;
          color: #111827;
        }
        .checkout-error {
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 16px;
          font-size: 13px;
          text-align: center;
          background: #fef2f2;
          color: #b91c1c;
        }
        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-field label {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }
        .form-field input,
        .form-field select {
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 10px 12px;
          font-size: 14px;
          color: #111827;
          transition: border-color 0.2s;
        }
        .form-field input:focus,
        .form-field select:focus {
          outline: none;
          border-color: #111827;
          background: #ffffff;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .btn-pay {
          margin-top: 20px;
          width: 100%;
          border-radius: 999px;
          background: #111827;
          padding: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-pay:hover {
          opacity: 0.9;
        }
        .btn-pay:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .protected-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
          padding: 8px 14px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 999px;
        }
        .protected-badge span {
          font-size: 12px;
          font-weight: 700;
          color: #15803d;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .checkout-secure {
          margin-top: 8px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        }
      `}</style>
    </>
  );
}
