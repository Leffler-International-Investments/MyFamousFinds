// FILE: /pages/support/disputes.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import React, { useEffect, useState } from "react";
import { auth, firebaseClientReady } from "../../utils/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Disputes() {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!firebaseClientReady || !auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    // Build a plain object from the form WITHOUT using FormData.entries()
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = String(value);
    });

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) {
        const token = await user.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }

      const r = await fetch("/api/disputes/create", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit dispute");
      }

      setOk(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
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
            {error && <div className="err">{error}</div>}
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
        .err {
          margin-top: 8px;
          color: #f87171;
          font-size: 13px;
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
