// FILE: /pages/seller/profile.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { FormEvent, useState } from "react";
import { useRequireSeller } from "../../hooks/useRequireSeller"; // Import seller security

// Public env-based URLs so you can control behaviour without code changes
const STRIPE_CONNECT_URL =
  process.env.NEXT_PUBLIC_STRIPE_CONNECT_URL || "";
const TAX_W9_URL = process.env.NEXT_PUBLIC_TAX_W9_URL || "";

export default function SellerProfile() {
  // Enforce seller-only access
  const { loading: authLoading } = useRequireSeller();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [stripeBusy, setStripeBusy] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [taxBusy, setTaxBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // TODO: replace this with a real API call when you have a backend route.
    await new Promise((res) => setTimeout(res, 1000)); // Simulate save

    setMessage("Profile updated successfully.");
    setSaving(false);
  }

  function handleStripeClick() {
    setStripeError(null);

    if (!STRIPE_CONNECT_URL) {
      // No URL configured – at least tell the user clearly
      alert(
        "Stripe Connect is not configured yet. Please contact support to set up your payout details."
      );
      return;
    }

    setStripeBusy(true);
    try {
      window.open(STRIPE_CONNECT_URL, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      console.error("stripe_connect_error", err);
      setStripeError(
        err?.message || "Unable to open Stripe Connect at the moment."
      );
    } finally {
      setStripeBusy(false);
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

  // While checking auth, keep screen blank
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

        {/* --- Main Form --- */}
        <form onSubmit={handleSubmit} className="form-container">
          {/* Section 1: Business Details */}
          <section className="form-card">
            <h2>Business Details</h2>
            <p className="form-subtitle">
              This information will be shown on your public seller profile.
            </p>
            <div className="form-grid">
              <div className="form-field">
                <label>Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  defaultValue="VintageLux Boutique"
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label>Contact Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue="hello@vintagelux.com"
                  className="form-input"
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
          </section>

          {/* Section 2: Payouts (Stripe) */}
          <section className="form-card">
            <h2>Bank & Payout Details</h2>
            <p className="form-subtitle">
              Your bank details are managed securely by Stripe. We do not
              store this information.
            </p>
            <div className="form-field">
              <button
                type="button"
                onClick={handleStripeClick}
                disabled={stripeBusy}
                className="btn-primary-dark"
              >
                {stripeBusy
                  ? "Opening Stripe…"
                  : "Manage Stripe Payout Account"}
              </button>
              <p className="form-note">
                (This will redirect to Stripe Connect to securely manage your
                bank account.)
              </p>
              {stripeError && (
                <p className="form-message error">{stripeError}</p>
              )}
            </div>
          </section>

          {/* Section 3: Tax (Avalara/Tax1099) */}
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
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {message && (
              <p className="form-message success">{message}</p>
            )}
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
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #ffffff;
          padding: 24px;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .form-card h2 {
          font-size: 18px;
          font-weight: 600;
          color: #111827; /* gray-900 */
        }
        .form-subtitle {
          margin-top: 4px;
          font-size: 14px;
          color: #4b5563; /* gray-600 */
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
          color: #374151; /* gray-700 */
        }
        .form-input,
        .form-input[type="textarea"] {
          margin-top: 4px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d1d5db; /* gray-300 */
          padding: 8px 12px;
          font-size: 14px;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .form-input:focus {
          border-color: #111827; /* gray-900 */
          outline: none;
        }
        
        .form-note {
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280; /* gray-500 */
        }
        
        .btn-primary-dark {
          border-radius: 6px;
          background: #111827; /* gray-900 */
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
          border: 1px solid #d1d5db; /* gray-300 */
          padding: 8px 16px;
          font-size: 14px;
          color: #374151; /* gray-700 */
          cursor: pointer;
        }
        .btn-secondary:hover {
          background: #f9fafb; /* gray-50 */
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
          background: #2563eb; /* blue-600 */
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          border: none;
          cursor: pointer;
        }
        .btn-submit-blue:hover {
          background: #1d4ed8; /* blue-700 */
        }
        .btn-submit-blue:disabled {
          opacity: 0.6;
        }
        
        .form-message {
          font-size: 14px;
        }
        .form-message.success {
          color: #059669; /* green-600 */
        }
        .form-message.error {
          font-size: 12px;
          color: #dc2626; /* red-600 */
        }
      `}</style>
    </div>
  );
}
