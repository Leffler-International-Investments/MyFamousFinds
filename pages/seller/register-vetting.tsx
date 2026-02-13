// FILE: /pages/seller/register-vetting.tsx
// Become a Seller – dark themed card form, posts to /api/seller/apply

import Head from "next/head";
import { FormEvent, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { autoPrefixPhone } from "../../utils/phoneFormat";

export default function SellerVetting() {
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [social, setSocial] = useState("");
  const [inventory, setInventory] = useState("");
  const [experience, setExperience] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedBusiness = businessName.trim();

    if (!trimmedBusiness || !trimmedEmail) {
      setError("Please enter your business name and email.");
      return;
    }
    if (!acceptTerms) {
      setError("Please confirm that you accept the seller terms.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactName,
          email: trimmedEmail,
          phone,
          website,
          social,
          inventory,
          experience,
          notes,
        }),
      });

      const json = (await res.json()) as { ok: boolean; error?: string };

      if (!json.ok) {
        setError(json.error || "We couldn't submit your application.");
        setSubmitting(false);
        return;
      }

      setSuccess(
        "Thank you! Your application has been submitted successfully. Our team will review it and contact you by email."
      );
      setSubmitting(false);

      setBusinessName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setWebsite("");
      setSocial("");
      setInventory("");
      setExperience("");
      setNotes("");
      setAcceptTerms(false);
    } catch (err: any) {
      console.error("seller_vetting_submit_error", err);
      setSubmitting(false);
      setError(
        err?.message || "We couldn't submit your application. Please try again."
      );
    }
  }

  return (
    <>
      <Head>
        <title>Become a Seller — Famous Finds</title>
      </Head>
      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card auth-card-wide">
            <h1>Become a Seller</h1>
            <p className="auth-subtitle">
              Apply to sell pre-loved luxury items on Famous-Finds. Once
              approved, you&apos;ll receive access to the Seller Admin console.
            </p>

            <div className="auth-info">
              Already approved?{" "}
              <Link href="/seller/login">Go to Seller Login</Link>.
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <form onSubmit={handleSubmit} className="auth-fields">
              <div className="auth-field">
                <label>Business / Store Name *</label>
                <input
                  type="text"
                  className="auth-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  placeholder="e.g. Ariel's Luxury Closet"
                />
              </div>

              <div className="auth-field-row">
                <div className="auth-field">
                  <label>Contact Name</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Ariel"
                  />
                </div>
                <div className="auth-field">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="auth-field-row">
                <div className="auth-field">
                  <label>Phone / WhatsApp</label>
                  <input
                    type="tel"
                    className="auth-input"
                    value={phone}
                    onChange={(e) => setPhone(autoPrefixPhone(e.target.value))}
                    placeholder="+61 4XX XXX XXX"
                  />
                </div>
                <div className="auth-field">
                  <label>Website</label>
                  <input
                    type="url"
                    className="auth-input"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://your-shop.com"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Instagram / Facebook / Other Social</label>
                <input
                  type="text"
                  className="auth-input"
                  value={social}
                  onChange={(e) => setSocial(e.target.value)}
                  placeholder="@yourshop or link"
                />
              </div>

              <div className="auth-field">
                <label>What do you want to sell?</label>
                <textarea
                  rows={3}
                  className="auth-textarea"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  placeholder="e.g. Pre-owned Chanel, Hermès and Dior bags; luxury shoes; accessories."
                />
              </div>

              <div className="auth-field">
                <label>Your experience with luxury resale</label>
                <textarea
                  rows={3}
                  className="auth-textarea"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Tell us briefly about your background, years in business, marketplaces you use, etc."
                />
              </div>

              <div className="auth-field">
                <label>Anything else we should know?</label>
                <textarea
                  rows={3}
                  className="auth-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes, questions or specific requests."
                />
              </div>

              <div className="auth-checkbox-row">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label htmlFor="acceptTerms">
                  I confirm that the items I plan to list are authentic and that
                  I accept Famous-Finds seller terms and vetting procedures.
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="auth-button-primary"
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            </form>

            <p className="auth-footer-note">
              Once approved, you will receive an email with next steps and a
              link to access your Seller Admin console.
            </p>
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #020617;
          color: #f9fafb;
        }

        .auth-main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px 16px 40px;
        }

        .auth-card {
          width: 100%;
          max-width: 720px;
          background: #020617;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          padding: 24px 22px 22px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.7);
        }

        h1 {
          font-size: 22px;
          margin: 0 0 8px;
        }

        .auth-subtitle {
          margin: 0 0 14px;
          font-size: 12px;
          color: #9ca3af;
        }

        .auth-info {
          margin-bottom: 10px;
          font-size: 12px;
          background: #0f172a;
          border-radius: 8px;
          padding: 8px 10px;
        }

        .auth-info a {
          color: #e5e7eb;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .auth-error,
        .auth-success {
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .auth-error {
          background: #7f1d1d;
          color: #fee2e2;
        }
        .auth-success {
          background: #14532d;
          color: #bbf7d0;
        }

        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .auth-field {
          width: 100%;
        }
        .auth-field label {
          font-size: 12px;
          color: #e5e7eb;
          display: block;
          margin-bottom: 4px;
        }

        .auth-field-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        @media (min-width: 640px) {
          .auth-field-row {
            flex-direction: row;
          }
        }

        .auth-input {
          width: 100%;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: rgba(15, 23, 42, 0.85);
          padding: 9px 12px;
          font-size: 13px;
          color: #f9fafb;
        }

        .auth-input::placeholder {
          color: #6b7280;
        }

        .auth-textarea {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: rgba(15, 23, 42, 0.85);
          padding: 9px 12px;
          font-size: 13px;
          color: #f9fafb;
          resize: vertical;
        }

        .auth-textarea::placeholder {
          color: #6b7280;
        }

        .auth-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 11px;
          color: #e5e7eb;
          margin-top: 4px;
        }

        .auth-checkbox-row input {
          margin-top: 2px;
        }

        .auth-button-primary {
          margin-top: 6px;
          width: 100%;
          border-radius: 999px;
          border: none;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: #f9fafb;
          color: #020617;
        }

        .auth-button-primary:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .auth-footer-note {
          margin-top: 12px;
          font-size: 11px;
          color: #9ca3af;
        }
      `}</style>
    </>
  );
}
