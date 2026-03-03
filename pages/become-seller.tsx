// FILE: /pages/become-seller.tsx
// Simplified single-page seller application — minimal fields, site-wide style

import Head from "next/head";
import { FormEvent, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { autoPrefixPhone } from "../utils/phoneFormat";

export default function BecomeSellerPage() {
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatToSell, setWhatToSell] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = contactName.trim();

    if (!trimmedName || !trimmedEmail) {
      setError("Please enter your name and email.");
      return;
    }
    if (!acceptTerms) {
      setError("Please confirm that your items are authentic.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: trimmedName,
          contactName: trimmedName,
          email: trimmedEmail,
          phone,
          inventory: whatToSell.trim(),
        }),
      });

      const json = (await res.json()) as { ok: boolean; error?: string };

      if (!json.ok) {
        setError(json.error || "We couldn't submit your application.");
        setSubmitting(false);
        return;
      }

      setSuccess(
        "Application submitted! Our team will review it and email you within a few business days."
      );
      setSubmitting(false);
      setContactName("");
      setEmail("");
      setPhone("");
      setWhatToSell("");
      setAcceptTerms(false);
    } catch (err: any) {
      console.error("become_seller_submit_error", err);
      setSubmitting(false);
      setError("We couldn't submit your application. Please try again.");
    }
  }

  return (
    <div className="page">
      <Head>
        <title>Become a Seller — Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Become a Seller</h1>
        <p className="intro">
          Apply to sell your pre-loved luxury items on Famous Finds. Fill out the
          form below and our team will review your application.
        </p>

        {error && <div className="banner banner-error">{error}</div>}
        {success && <div className="banner banner-success">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="seller-form">
            <label className="field-label">
              Your Name <span className="req">*</span>
              <input
                type="text"
                className="field-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                placeholder="Full name"
              />
            </label>

            <label className="field-label">
              Email <span className="req">*</span>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </label>

            <label className="field-label">
              Phone
              <input
                type="tel"
                className="field-input"
                value={phone}
                onChange={(e) => setPhone(autoPrefixPhone(e.target.value))}
                placeholder="+1 555 000 0000"
              />
            </label>

            <label className="field-label">
              What would you like to sell?
              <textarea
                rows={3}
                className="field-input field-textarea"
                value={whatToSell}
                onChange={(e) => setWhatToSell(e.target.value)}
                placeholder="e.g. Pre-owned Chanel bags, luxury watches, designer shoes..."
              />
            </label>

            <div className="checkbox-row">
              <input
                id="accept"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <label htmlFor="accept">
                I confirm that the items I plan to list are authentic and I
                accept the{" "}
                <Link href="/seller-terms">Famous Finds seller terms</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="submit-btn"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        )}

        <div className="card">
          <h2>What happens next?</h2>
          <ol className="steps-list">
            <li>Our team reviews and verifies your details</li>
            <li>Once approved, you&apos;ll receive an email with access to the Seller Dashboard</li>
            <li>Complete your seller profile (shipping address, payout details)</li>
            <li>Start listing items — proof of purchase required for items over $499</li>
          </ol>
        </div>

        <p className="footer-note">
          Already a seller?{" "}
          <Link href="/seller/login">Sign in to your account</Link>
        </p>
      </main>
      <Footer />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #ffffff;
          color: #111827;
          display: flex;
          flex-direction: column;
        }
        .wrap {
          max-width: 540px;
          margin: 24px auto 60px;
          padding: 0 16px;
        }
        h1 {
          font-family: "Georgia", serif;
          font-size: 26px;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        /* Banners */
        .banner {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 18px;
          line-height: 1.5;
        }
        .banner-success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .banner-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Form */
        .seller-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 28px;
        }

        /* Fields */
        .field-label {
          display: flex;
          flex-direction: column;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          gap: 6px;
        }
        .req {
          color: #dc2626;
        }
        .field-input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 14px;
          color: #111827;
          background: #ffffff;
          transition: border-color 0.15s;
          outline: none;
        }
        .field-input:focus {
          border-color: #111827;
          box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.08);
        }
        .field-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        /* Checkbox */
        .checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #4b5563;
        }
        .checkbox-row input {
          margin-top: 3px;
        }
        .checkbox-row a {
          color: #111827;
          text-decoration: underline;
        }

        /* Submit */
        .submit-btn {
          margin-top: 4px;
          width: 100%;
          padding: 12px 0;
          border: none;
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .submit-btn:hover:not(:disabled) {
          background: #1f2937;
        }
        .submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Info card */
        .card {
          background: #f9fafb;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 20px 18px;
          margin-bottom: 16px;
        }
        .card h2 {
          font-size: 16px;
          margin: 0 0 10px;
          font-weight: 600;
        }
        .steps-list {
          margin: 0;
          padding-left: 18px;
          color: #374151;
          line-height: 1.7;
          font-size: 14px;
        }

        /* Footer note */
        .footer-note {
          font-size: 13px;
          color: #6b7280;
          text-align: center;
          margin-top: 8px;
        }
        .footer-note a {
          color: #111827;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
