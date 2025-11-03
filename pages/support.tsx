// FILE: /pages/support.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState } from "react";

export default function Support() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr("");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("Failed");
      setSent(true);
    } catch (e:any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head><title>Support — Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>Support</h1>
        <p className="hint">Open a ticket (buyer/seller). We reply by email.</p>
        {sent ? (
          <div className="ok">Thanks! Your ticket was submitted.</div>
        ) : (
          <form className="form" onSubmit={submit}>
            <div className="grid">
              <label>
                Your name
                <input name="name" required placeholder="Full name" />
              </label>
              <label>
                Email
                <input type="email" name="email" required placeholder="you@email.com" />
              </label>
              <label className="col2">
                Topic
                <select name="topic" defaultValue="order">
                  <option value="order">Order / Delivery</option>
                  <option value="listing">Listing</option>
                  <option value="refund">Refund</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="col2">
                Message
                <textarea name="message" rows={5} required placeholder="Tell us what's wrong..." />
              </label>
            </div>
            <button className="btn" disabled={busy}>{busy ? "Sending..." : "Submit Ticket"}</button>
            {err && <div className="err">{err}</div>}
          </form>
        )}
      </main>
      <Footer />

      <style jsx>{`
        .wrap{ max-width:900px; margin:0 auto; padding:24px 16px; }
        h1{ margin-bottom:6px; }
        .hint{ color:#aaa; margin:0 0 18px; }
        .ok{ border:1px solid #1a1a1a; background:#0f0f0f; padding:16px; border-radius:10px; }
        .form{ border:1px solid #1a1a1a; border-radius:12px; padding:18px; background:#0f0f0f; }
        .grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        label{ display:flex; flex-direction:column; gap:6px; color:#ddd; font-size:14px; }
        input,select,textarea{ background:#0b0b0b; border:1px solid #1a1a1a; border-radius:8px; color:#eaeaea; padding:10px; }
        .col2{ grid-column:1 / -1; }
        .btn{ margin-top:12px; background:#fff; color:#000; border:none; border-radius:8px; padding:10px 18px; font-weight:700; }
        .err{ margin-top:8px; color:#f87171; }
        @media (max-width:720px){ .grid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
