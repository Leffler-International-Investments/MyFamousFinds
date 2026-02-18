// FILE: /pages/contact.tsx

import Head from "next/head";
import { FormEvent, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const SUBJECT_OPTIONS = [
  "Order Issue",
  "Listing Question",
  "Payout / Billing",
  "Seller Application",
  "Returns & Refunds",
  "Report a Problem",
  "General Inquiry",
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [sendTo, setSendTo] = useState<"support" | "admin">("support");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !subject || !trimmedMessage) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          topic: subject,
          sendTo,
          message: trimmedMessage,
        }),
      });

      const json = (await res.json()) as {
        ok: boolean;
        ticketId?: string;
        error?: string;
      };

      if (!json.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setSuccess(
        `Your message has been sent! Ticket #${json.ticketId} — we'll get back to you within 1–2 business days.`
      );
      setName("");
      setEmail("");
      setSubject("");
      setSendTo("support");
      setMessage("");
      setSubmitting(false);
    } catch {
      setError("Could not send your message. Please try again later.");
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <Head>
        <title>Contact – MyFamousFinds</title>
      </Head>
      <Header />
      <main className="wrap">
        <h1>Contact Us</h1>
        <p className="intro">
          Have a question about an order, listing, payout, or policy? Fill out
          the form below and our team will get back to you within 1–2 business
          days.
        </p>

        {success && <div className="banner banner-success">{success}</div>}
        {error && <div className="banner banner-error">{error}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="contact-form">
            {/* Name */}
            <label className="field-label">
              Your Name <span className="req">*</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="field-input"
                required
              />
            </label>

            {/* Email */}
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

            {/* Subject */}
            <label className="field-label">
              Subject <span className="req">*</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="field-input"
                required
              >
                <option value="" disabled>
                  — Choose a topic —
                </option>
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>

            {/* Send To */}
            <fieldset className="field-group">
              <legend className="field-label">Send To</legend>
              <div className="radio-row">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sendTo"
                    value="support"
                    checked={sendTo === "support"}
                    onChange={() => setSendTo("support")}
                  />
                  <span>Support Team</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sendTo"
                    value="admin"
                    checked={sendTo === "admin"}
                    onChange={() => setSendTo("admin")}
                  />
                  <span>Admin / Management</span>
                </label>
              </div>
            </fieldset>

            {/* Message */}
            <label className="field-label">
              Message <span className="req">*</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or issue…"
                rows={6}
                className="field-input field-textarea"
                required
              />
            </label>

            <button type="submit" disabled={submitting} className="submit-btn">
              {submitting ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}

        {success && (
          <button
            className="submit-btn"
            onClick={() => setSuccess(null)}
            style={{ marginTop: 16 }}
          >
            Send Another Message
          </button>
        )}

        <div className="card-grid">
          <section className="card">
            <h2>Email Directly</h2>
            <p>
              General support:{" "}
              <a href="mailto:support@myfamousfinds.com">
                support@myfamousfinds.com
              </a>
            </p>
          </section>

          <section className="card">
            <h2>Response Times</h2>
            <p>
              We aim to respond to all messages within 1–2 business days. During
              busy periods it may take a little longer, but we reply to every
              ticket.
            </p>
          </section>
        </div>
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
          max-width: 680px;
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
          margin-bottom: 20px;
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
        .contact-form {
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
        select.field-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }
        .field-textarea {
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
        }

        /* Radio */
        .field-group {
          border: none;
          padding: 0;
          margin: 0;
        }
        .field-group legend {
          margin-bottom: 6px;
        }
        .radio-row {
          display: flex;
          gap: 20px;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }
        .radio-label input[type="radio"] {
          accent-color: #111827;
        }

        /* Submit */
        .submit-btn {
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

        /* Cards */
        .card-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 12px;
        }
        .card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 16px 18px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        .card h2 {
          font-size: 18px;
          margin-bottom: 6px;
        }
        .card p {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
