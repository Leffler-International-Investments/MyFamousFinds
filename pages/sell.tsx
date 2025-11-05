// FILE: /pages/sell.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FormEvent, useState } from "react";

export default function Sell() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitted(false);

    try {
      const fd = new FormData(e.currentTarget);
      const payload: any = {};
      fd.forEach((v, k) => (payload[k] = v));

      const res = await fetch("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Submission failed");
      setSubmitted(true);
      e.currentTarget.reset();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error submitting listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Sell an Item – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Sell an Item</h1>
        <p className="intro">
          Submit a pre-loved piece for sale. Each submission is reviewed by our
          team before going live.
        </p>

        {submitted && (
          <div className="msg success">
            ✅ Your listing has been received for review.
          </div>
        )}

        <form onSubmit={onSubmit} className="form">
          <input name="title" placeholder="Title" required />
          <input name="brand" placeholder="Brand" />
          <input name="category" placeholder="Category (bags, shoes, etc.)" />
          <input name="price" type="number" placeholder="Price (AUD)" required />
          <input name="image" placeholder="Image URL" />
          <textarea
            name="description"
            rows={4}
            placeholder="Description"
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Listing"}
          </button>
        </form>

        <p className="note">
          Listings will appear as <strong>Pending Review</strong> until
          authenticated and approved.
        </p>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        h1 {
          font-size: 26px;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          color: #d1d5db;
          margin-bottom: 20px;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        input,
        textarea {
          border-radius: 8px;
          border: 1px solid #374151;
          background: #111827;
          color: white;
          padding: 8px 10px;
          font-size: 14px;
        }
        button {
          margin-top: 10px;
          background: white;
          color: black;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .msg {
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 14px;
          font-size: 13px;
        }
        .success {
          background: #065f46;
          color: #d1fae5;
        }
        .note {
          margin-top: 16px;
          font-size: 12px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
