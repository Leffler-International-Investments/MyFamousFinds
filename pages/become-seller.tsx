// FILE: /pages/become-seller.tsx
// Streamlined seller application — simplified from original register-vetting
// Focus on essential verification only, remove complex questionnaire

import Head from "next/head";
import { FormEvent, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
          inventory: whatToSell,
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
    <>
      <Head>
        <title>Become a Seller - Famous Finds</title>
      </Head>
      <div className="page">
        <Header />
        <main className="main">
          <div className="card">
            <h1>Become a Seller</h1>
            <p className="subtitle">
              Apply to sell your pre-loved luxury items on Famous Finds. Our team
              manually reviews every application to ensure quality and
              authenticity.
            </p>

            <div className="info-box">
              <strong>What happens next?</strong>
              <ol>
                <li>Submit your application below</li>
                <li>Our team reviews and verifies your details</li>
                <li>Once approved, you get access to the Seller Dashboard</li>
                <li>Start listing items — proof of purchase required for items over $499</li>
              </ol>
            </div>

            {error && <div className="error-box">{error}</div>}
            {success && <div className="success-box">{success}</div>}

            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label>Your Name *</label>
                <input
                  type="text"
                  className="input"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  placeholder="Full name"
                />
              </div>

              <div className="field">
                <label>Email *</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="field">
                <label>Phone (optional)</label>
                <input
                  type="tel"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </div>

              <div className="field">
                <label>What would you like to sell? (optional)</label>
                <textarea
                  rows={3}
                  className="textarea"
                  value={whatToSell}
                  onChange={(e) => setWhatToSell(e.target.value)}
                  placeholder="e.g. Pre-owned Chanel bags, luxury watches, designer shoes..."
                />
              </div>

              <div className="checkbox-row">
                <input
                  id="accept"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label htmlFor="accept">
                  I confirm that the items I plan to list are authentic and I
                  accept Famous Finds seller terms.
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-submit"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>

            <p className="footer-note">
              Already a seller?{" "}
              <Link href="/login">Sign in to your account</Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          color: #111827;
        }
        .main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 16px;
        }
        .card {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #e5e7eb;
          padding: 32px 28px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
        }
        h1 {
          font-family: ui-serif, "Times New Roman", serif;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          text-align: center;
        }
        .subtitle {
          margin: 0 0 20px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          line-height: 1.5;
        }
        .info-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #166534;
        }
        .info-box strong {
          display: block;
          margin-bottom: 8px;
        }
        .info-box ol {
          margin: 0;
          padding-left: 18px;
          line-height: 1.6;
        }
        .error-box {
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 14px;
          font-size: 13px;
          text-align: center;
        }
        .success-box {
          background: #ecfdf5;
          color: #065f46;
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 14px;
          font-size: 13px;
          text-align: center;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }
        .input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 10px 14px;
          font-size: 14px;
          color: #111827;
        }
        .input:focus {
          outline: none;
          border-color: #111827;
          background: #ffffff;
        }
        .textarea {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 10px 14px;
          font-size: 14px;
          color: #111827;
          resize: vertical;
        }
        .textarea:focus {
          outline: none;
          border-color: #111827;
          background: #ffffff;
        }
        .checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }
        .checkbox-row input {
          margin-top: 2px;
        }
        .btn-submit {
          width: 100%;
          border-radius: 999px;
          border: none;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .btn-submit:hover:not(:disabled) {
          opacity: 0.9;
        }
        .footer-note {
          margin-top: 16px;
          font-size: 13px;
          color: #6b7280;
          text-align: center;
        }
        .footer-note a {
          color: #111827;
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
