// FILE: /pages/seller/profile.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { FormEvent, useEffect, useState } from "react";
import { autoPrefixPhone } from "../../utils/phoneFormat";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { sellerFetch } from "../../utils/sellerClient";

const TAX_W9_URL = process.env.NEXT_PUBLIC_TAX_W9_URL || "";

export default function SellerProfile() {
  const { loading: authLoading } = useRequireSeller();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paypalEmail, setPaypalEmail] = useState("");

  // Shipping address state (for UPS labels)
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressCountry, setAddressCountry] = useState("United States");
  const [addressPrefilled, setAddressPrefilled] = useState(false);

  const [taxBusy, setTaxBusy] = useState(false);

  // Prefill address from seller_banking if it exists
  // (the banking API also falls back to the sellers collection
  //  so address from become-a-seller application is always available)
  useEffect(() => {
    let cancelled = false;
    const loadAddress = async () => {
      try {
        const sellerEmail = String(
          window.localStorage.getItem("ff-email") || ""
        )
          .trim()
          .toLowerCase();
        if (!sellerEmail) return;

        const res = await sellerFetch(
          `/api/seller/banking?email=${encodeURIComponent(sellerEmail)}`
        );
        const json = await res.json();
        if (!json?.ok || !json?.prefs || cancelled) return;

        const prefs = json.prefs || {};
        if (prefs.addressLine1) {
          setAddressLine1(prefs.addressLine1);
          setAddressLine2(prefs.addressLine2 || "");
          setCity(prefs.city || "");
          setState(prefs.state || "");
          setPostalCode(prefs.postalCode || "");
          setAddressCountry(prefs.country || "United States");
          setAddressPrefilled(true);
        }
        if (prefs.paypalEmail) {
          setPaypalEmail(prefs.paypalEmail);
        }
      } catch (err) {
        console.warn("Could not prefill address from banking:", err);
      }
    };
    loadAddress();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      businessName: String(formData.get("businessName") || ""),
      email: String(formData.get("email") || ""),
      mobile: String(formData.get("mobile") || ""),
      country: String(formData.get("country") || ""),
      bio: String(formData.get("bio") || ""),
      website: String(formData.get("website") || ""),
      otherPlatforms: String(formData.get("otherPlatforms") || ""),
      vettingNotes: String(formData.get("vettingNotes") || ""),
      paypalEmail: paypalEmail.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      addressCity: city.trim(),
      addressState: state.trim(),
      addressPostalCode: postalCode.trim(),
      addressCountry: addressCountry.trim(),
    };

    try {
      const res = await sellerFetch("/api/seller/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Unable to save profile.");
      }

      setMessage(
        "Your seller profile has been saved successfully."
      );
    } catch (err: any) {
      console.error("seller_profile_save_error", err);
      setError(err?.message || "Unable to save profile right now.");
    } finally {
      setSaving(false);
    }
  }

  function handleTaxClick() {
    if (!TAX_W9_URL) {
      alert(
        "The W-9 tax form link has not been configured yet. Please contact support."
      );
      return;
    }

    setTaxBusy(true);
    try {
      window.open(TAX_W9_URL, "_blank", "noopener,noreferrer");
    } finally {
      setTaxBusy(false);
    }
  }

  if (authLoading) {
    return <div className="dashboard-page"></div>;
  }

  return (
    <div className="dashboard-page">
      <Head>
        <title>Seller Profile — Famous Finds</title>
      </Head>
      <Header />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Seller Profile</h1>
          <Link href="/seller/dashboard">← Back to Seller Dashboard</Link>
        </div>

        {error && <p className="form-message error">{error}</p>}
        {message && <p className="form-message success">{message}</p>}

        <form onSubmit={handleSubmit} className="form-container">
          {/* Section 1: Business & contact details */}
          <section className="form-card">
            <h2>Business Details</h2>
            <p className="form-subtitle">
              This information will be shown on your public seller profile and
              used by our team to vet your account.
            </p>
            <div className="form-grid">
              <div className="form-field">
                <label>Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  defaultValue="VintageLux Boutique"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-field">
                <label>Contact Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue="hello@vintagelux.com"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-field">
                <label>Mobile number</label>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="+1 555 000 0000"
                  className="form-input"
                  required
                  onChange={(e) => { e.target.value = autoPrefixPhone(e.target.value); }}
                />
              </div>
              <div className="form-field">
                <label>Country / Region</label>
                <input
                  type="text"
                  name="country"
                  placeholder="United States"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>Public Bio</label>
              <textarea
                name="bio"
                rows={3}
                defaultValue="Curators of fine vintage bags and accessories. All items 100% authentic."
                className="form-input"
              />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Website or Instagram</label>
                <input
                  type="text"
                  name="website"
                  placeholder="https://yourboutique.com or @yourhandle"
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label>Other marketplaces you sell on</label>
                <input
                  type="text"
                  name="otherPlatforms"
                  placeholder="e.g. Famous Finds Shopify, other resale sites"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Additional notes for vetting (optional)</label>
              <textarea
                name="vettingNotes"
                rows={2}
                placeholder="Anything that helps us verify you (store history, references, social links, etc.)."
                className="form-input"
              />
            </div>
          </section>

          {/* Section 2: Shipping Address */}
          <section className="form-card">
            <h2>Shipping Address (for UPS Labels)</h2>
            <p className="form-subtitle">
              This address is used as the ship-from address on UPS labels.
              It will be prefilled when you create listings.
            </p>
            {addressPrefilled && (
              <p className="form-note address-prefilled">
                We prefilled your address from your account. Please confirm or update it.
              </p>
            )}
            <div className="form-grid">
              <div className="form-field">
                <label>Address Line 1 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street and number"
                  required
                />
              </div>
              <div className="form-field">
                <label>Address Line 2 (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apartment, suite, unit"
                />
              </div>
              <div className="form-field">
                <label>City *</label>
                <input
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  required
                />
              </div>
              <div className="form-field">
                <label>State / Province *</label>
                <input
                  type="text"
                  className="form-input"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  required
                />
              </div>
              <div className="form-field">
                <label>Postal Code *</label>
                <input
                  type="text"
                  className="form-input"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="ZIP / Postal"
                  required
                />
              </div>
              <div className="form-field">
                <label>Country *</label>
                <input
                  type="text"
                  className="form-input"
                  value={addressCountry}
                  onChange={(e) => setAddressCountry(e.target.value)}
                  placeholder="Country"
                  required
                />
              </div>
            </div>
          </section>

          {/* Section 3: Payouts (PayPal) */}
          <section className="form-card">
            <h2>PayPal Payout Details</h2>
            <p className="form-subtitle">
              Payouts are sent to your PayPal account. Enter your PayPal email
              below, or update it in Banking &amp; Payouts.
            </p>
            <div className="form-field">
              <label>PayPal email</label>
              <input
                type="email"
                name="paypalEmail"
                className="form-input"
                placeholder="your-paypal@email.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
              <p className="form-note">
                This should match the email on your active PayPal account.
              </p>
            </div>
          </section>

          {/* Section 3: Tax (W-9) */}
          <section className="form-card">
            <h2>Tax Information (W-9)</h2>
            <p className="form-subtitle">
              We are required to collect this information for all US sellers.
            </p>
            <div className="form-field">
              <button
                type="button"
                onClick={handleTaxClick}
                disabled={taxBusy}
                className="btn-secondary"
              >
                {taxBusy ? "Opening…" : "Update W-9 Tax Form"}
              </button>
              <p className="form-note">
                (This will open a secure form from our tax partner.)
              </p>
            </div>
          </section>

          {/* Save Button */}
          <div className="form-save-bar">
            <button
              type="submit"
              disabled={saving}
              className="btn-submit-blue"
            >
              {saving ? "Submitting..." : "Submit profile for review"}
            </button>
          </div>
        </form>
      </main>
      <Footer />

      <style jsx>{`
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-card {
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 24px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .form-card h2 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        .form-subtitle {
          margin-top: 4px;
          font-size: 14px;
          color: #4b5563;
        }

        .form-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .form-field {
          margin-top: 16px;
        }
        .form-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }
        .form-input {
          margin-top: 4px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-size: 14px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .form-input:focus {
          border-color: #111827;
          outline: none;
        }

        .form-note {
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
        }
        .address-prefilled {
          margin-top: 12px;
          color: #166534;
          font-weight: 600;
          font-size: 13px;
        }

        .btn-primary-dark {
          border-radius: 6px;
          background: #111827;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          border: none;
          cursor: pointer;
        }
        .btn-primary-dark:hover {
          background: #000;
        }
        .btn-primary-dark:disabled {
          opacity: 0.6;
        }

        .btn-secondary {
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 8px 16px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background: #f9fafb;
        }
        .btn-secondary:disabled {
          opacity: 0.6;
        }

        .form-save-bar {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-submit-blue {
          border-radius: 6px;
          background: #2563eb;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          border: none;
          cursor: pointer;
        }
        .btn-submit-blue:hover {
          background: #1d4ed8;
        }
        .btn-submit-blue:disabled {
          opacity: 0.6;
        }

        .form-message {
          font-size: 14px;
          margin-bottom: 8px;
        }
        .form-message.success {
          color: #059669;
        }
        .form-message.error {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}
