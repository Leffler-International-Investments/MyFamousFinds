// FILE: /pages/authentication-complaint.tsx

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AuthenticationComplaintPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [concern, setConcern] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refId, setRefId] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedConcern = concern.trim();

    if (!trimmedName || !trimmedEmail || !trimmedConcern) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/authentication-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          orderNumber: orderNumber.trim(),
          itemDescription: itemDescription.trim(),
          concern: trimmedConcern,
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        refId?: string;
        error?: string;
      };

      if (!json.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setRefId(json.refId || null);
      setShowThankYou(true);
      setName("");
      setEmail("");
      setOrderNumber("");
      setItemDescription("");
      setConcern("");
      setSubmitting(false);
    } catch {
      setError("Could not send your complaint. Please try again later.");
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <Head>
        <title>Report an Authenticity Concern — Famous Finds</title>
        <meta
          name="description"
          content="Report an authenticity concern about an item purchased on Famous Finds. Our customer service team will investigate promptly."
        />
      </Head>
      <Header />

      <main className="wrap">
        <div className="back-link">
          <Link href="/authenticity">← Back to Authenticity</Link>
        </div>

        <h1>Report an Authenticity Concern</h1>
        <p className="intro">
          If you have received an item that you believe may not be authentic,
          please complete the form below. Our authentication team treats every
          report with the highest priority and will investigate your concern
          thoroughly.
        </p>

        {error && <div className="banner banner-error">{error}</div>}

        <form onSubmit={handleSubmit} className="complaint-form">
          <label className="field-label">
            Your Full Name <span className="req">*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="field-input"
              required
            />
          </label>

          <label className="field-label">
            Email Address <span className="req">*</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field-input"
              required
            />
          </label>

          <label className="field-label">
            Order Number
            <span className="hint">If applicable</span>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. FF-12345"
              className="field-input"
            />
          </label>

          <label className="field-label">
            Item Description
            <span className="hint">Brand, item type, or listing title</span>
            <input
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="e.g. Louis Vuitton Neverfull MM"
              className="field-input"
            />
          </label>

          <label className="field-label">
            Describe Your Concern <span className="req">*</span>
            <span className="hint">
              Please be as specific as possible — what made you question the
              item&apos;s authenticity?
            </span>
            <textarea
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="Tell us what you noticed — materials, stitching, hardware, serial numbers, packaging, or anything else that concerns you…"
              rows={6}
              className="field-input field-textarea"
              required
            />
          </label>

          <button type="submit" disabled={submitting} className="submit-btn">
            {submitting ? "Submitting…" : "Submit Complaint"}
          </button>
        </form>
      </main>

      <Footer />

      {/* ── Thank You Popup ── */}
      {showThankYou && (
        <div className="overlay" onClick={() => setShowThankYou(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-icon">&#10003;</div>
            <h2 className="popup-title">
              Thank You for Bringing This to Our Attention
            </h2>
            <p className="popup-body">
              We truly appreciate you taking the time to report this concern.
              Protecting the integrity of every item on our platform matters
              deeply to us, and reports like yours help us maintain the trust
              our community deserves.
            </p>
            {refId && (
              <p className="popup-ref">
                Your reference number: <strong>#{refId}</strong>
              </p>
            )}
            <p className="popup-body">
              Our customer service team has received your complaint and will be
              in touch with you shortly. We investigate every authenticity
              concern with the utmost care and will keep you informed at every
              step of the process.
            </p>
            <p className="popup-note">
              Please allow up to 1–2 business days for our initial response.
              If your concern is urgent, we may reach out sooner.
            </p>
            <div className="popup-actions">
              <button
                className="popup-btn popup-btn-primary"
                onClick={() => setShowThankYou(false)}
              >
                Close
              </button>
              <Link href="/" className="popup-btn popup-btn-secondary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #ffffff;
          color: #111827;
          display: flex;
          flex-direction: column;
        }
        .wrap {
          max-width: 640px;
          margin: 24px auto 60px;
          padding: 0 16px;
        }
        .back-link {
          margin-bottom: 16px;
        }
        .back-link a {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }
        .back-link a:hover {
          color: #111827;
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
          line-height: 1.6;
        }

        /* Banners */
        .banner {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 18px;
          line-height: 1.5;
        }
        .banner-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Form */
        .complaint-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }
        .field-label {
          display: flex;
          flex-direction: column;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          gap: 4px;
        }
        .req {
          color: #dc2626;
        }
        .hint {
          font-size: 12px;
          font-weight: 400;
          color: #6b7280;
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
          font-family: inherit;
        }
        .field-input:focus {
          border-color: #111827;
          box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.08);
        }
        .field-textarea {
          resize: vertical;
          min-height: 120px;
        }

        /* Submit */
        .submit-btn {
          padding: 14px 0;
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

        /* ── Thank You Popup ── */
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .popup {
          background: #ffffff;
          border-radius: 20px;
          padding: 32px 28px;
          max-width: 520px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: popup-in 0.25s ease-out;
        }
        @keyframes popup-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .popup-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #ecfdf5;
          color: #059669;
          font-size: 28px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .popup-title {
          font-family: "Georgia", serif;
          font-size: 22px;
          margin: 0 0 14px;
          color: #111827;
        }
        .popup-body {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.7;
          margin: 0 0 12px;
        }
        .popup-ref {
          font-size: 14px;
          color: #111827;
          margin: 0 0 12px;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 8px;
          display: inline-block;
        }
        .popup-note {
          font-size: 12px;
          color: #9ca3af;
          margin: 0 0 20px;
          line-height: 1.5;
        }
        .popup-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .popup-btn {
          padding: 10px 24px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          border: none;
          transition: all 0.15s;
          font-family: inherit;
        }
        .popup-btn-primary {
          background: #111827;
          color: #ffffff;
        }
        .popup-btn-primary:hover {
          background: #000000;
        }
        .popup-btn-secondary {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
        }
        .popup-btn-secondary:hover {
          border-color: #111827;
        }
      `}</style>

      <style jsx global>{`
        .popup-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
