// FILE: /pages/support/disputes.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import React, { useState } from "react";

export default function Disputes() {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    // Build a plain object from the form WITHOUT using FormData.entries()
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = String(value);
    });

    await fetch("/api/disputes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setOk(true);
    setBusy(false);
  }

  return (
    <>
      <Head>
        <title>Open Dispute — Famous Finds</title>
      </Head>
      <Header />
      <main className="wrap">
        <h1>Open a Dispute</h1>
        {ok ? (
          <div className="ok">Submitted. We’ll email you updates.</div>
        ) : (
          <form className="form" onSubmit={submit}>
            <label>
              Order ID
              <input name="orderId" required />
            </label>
            <label>
              Role
              <select name="role">
                <option>Buyer</option>
                <option>Seller</option>
              </select>
            </label>
            <label>
              Reason
              <select name="reason">
                <option>Not as described</option>
                <option>Not delivered</option>
                <option>Damaged</option>
                <option>Late</option>
                <option>Other</option>
              </select>
            </label>
            <label className="col2">
              Details
              <textarea name="details" rows={4} />
            </label>
            <button className="btn" disabled={busy}>
              {busy ? "Submitting…" : "Submit"}
            </button>
          </form>
        )}
      </main>
      <Footer />
      <style jsx>{`
        .wrap {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        h1 {
          margin-bottom: 16px;
        }
        .form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .col2 {
          grid-column: 1 / -1;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #ddd;
          font-size: 14px;
        }
        input,
        select,
        textarea {
          background: #0b0b0b;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          color: #eaeaea;
          padding: 10px;
        }
        .btn {
          background: #fff;
          color: #000;
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          font-weight: 700;
          width: max-content;
          margin-top: 8px;
        }
        .btn[disabled] {
          opacity: 0.7;
          cursor: default;
        }
        .ok {
          border: 1px solid #1a1a1a;
          background: #0f0f0f;
          padding: 16px;
          border-radius: 10px;
        }
        @media (max-width: 900px) {
          .form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
