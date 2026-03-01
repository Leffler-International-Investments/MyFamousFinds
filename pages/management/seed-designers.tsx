// FILE: /pages/management/seed-designers.tsx
// Simple admin UI to seed designers via the API.
// Paste one brand per line OR leave empty to insert defaults.
// Requires the x-admin-key you set in Vercel (ADMIN_SEED_KEY).

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function SeedDesigners() {
  const { loading } = useRequireAdmin();
  const [text, setText] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function runSeed() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/seed-designers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": key.trim(),
        },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "failed");
      }
      setMsg(`✅ Upserted ${json.upserted} designers.`);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Error"}`);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="dark-theme-page">
        <Head><title>Seed Designers | Famous Finds</title></Head>
        <Header />
        <main className="section"><p>Checking admin access…</p></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Seed Designers | Famous Finds</title>
      </Head>
      <Header />
      <main className="section">
        <div className="back-link">
          <Link href="/management/dashboard">← Back to Management Dashboard</Link>
        </div>

        <h1>Seed Designers</h1>
        <p className="hint">
          Paste one brand per line. Leave empty to insert defaults. Enter your admin key to run.
        </p>

        <label className="block">
          <span>Admin Key (matches <code>ADMIN_SEED_KEY</code>)</span>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <label className="block">
          <span>Designers (one per line)</span>
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Chanel\nGucci\nHermès\nLouis Vuitton\nPrada`}
          />
        </label>

        <div className="actions">
          <button className="btn-primary" onClick={runSeed} disabled={busy || !key.trim()}>
            {busy ? "Seeding…" : "Seed designers"}
          </button>
        </div>

        {!!msg && <p className="banner">{msg}</p>}
      </main>
      <Footer />

      <style jsx>{`
        h1 { color: #fff; font-size: 20px; margin: 8px 0 12px; }
        .hint { color: #9ca3af; font-size: 12px; margin-bottom: 12px; }
        .block { display: block; margin: 12px 0; }
        .block span { display: block; font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
        input, textarea {
          width: 100%;
          background: #00000066;
          color: #fff;
          border: 1px solid #ffffff1a;
          border-radius: 6px;
          padding: 10px;
          font-size: 12px;
        }
        textarea { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .actions { margin-top: 10px; }
        .btn-primary {
          border-radius: 999px; padding: 10px 16px; font-size: 12px; font-weight: 700;
          background: #fff; color: #000; border: none; cursor: pointer;
        }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .banner { margin-top: 12px; font-weight: 600; }
      `}</style>
    </div>
  );
}
